-- ============================================================
-- MIGRATION: reserve_stock_for_delivery
-- File: 11_reserve_stock_for_delivery.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `order_items`, `orders`, and `stock` tables all migrated their primary
-- keys from bigint to uuid. Parameters p_order_item_id and p_stock_id as well
-- as the internal v_stock_id variable must be updated to uuid. A TOCTOU
-- (time-of-check to time-of-use) race condition was also fixed: the availability
-- check SELECT previously ran without locking the stock row, so two concurrent
-- reservations could both pass the check and collectively over-reserve. Adding
-- FOR UPDATE to the availability check SELECT serializes concurrent reservations
-- on the same stock row.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_order_item_id: bigint → uuid  (reason: order_items PK migrated)
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_stock_id: bigint → uuid  (local variable)
--   - [TOCTOU FIX] Added FOR UPDATE to the availability check SELECT to prevent
--     two concurrent reservations from both passing the check with the same stock
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   reserve_stock_for_delivery(p_order_item_id bigint, p_product_id bigint,
--     p_location_id bigint, p_stock_id bigint,
--     p_qty_in_base_units numeric, p_over_sell_quantity numeric) RETURNS void
--
-- NEW SIGNATURE:
--   reserve_stock_for_delivery(p_order_item_id uuid, p_product_id bigint,
--     p_location_id bigint, p_stock_id uuid,
--     p_qty_in_base_units numeric, p_over_sell_quantity numeric) RETURNS void
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, calls
--   get_or_create_stock_with_location_pi_and_pi (05)
-- ============================================================

-- 1. Drop old 6-param signature
DROP FUNCTION IF EXISTS public.reserve_stock_for_delivery(bigint, bigint, bigint, bigint, numeric, numeric);

-- Also drop old 7-param legacy (already in 00_drop_legacy_functions.sql but safe to repeat)
DROP FUNCTION IF EXISTS public.reserve_stock_for_delivery(bigint, bigint, bigint, bigint, bigint, numeric, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.reserve_stock_for_delivery(p_order_item_id uuid, p_product_id bigint, p_location_id bigint, p_stock_id uuid, p_qty_in_base_units numeric, p_over_sell_quantity numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_stock_id uuid;
  v_lot_id   bigint;
  v_total_to_reserve numeric;
  v_available_qty    numeric;
begin
  ------------------------------------------------------------------
  -- Obtener o crear stock (sin product_presentation_id)
  ------------------------------------------------------------------
  if p_stock_id is null then
    v_stock_id := get_or_create_stock_with_location_pi_and_pi(
      p_product_id,
      p_location_id
    );
  else
    v_stock_id := p_stock_id;
  end if;

  ------------------------------------------------------------------
  -- Calcular total a reservar en unidad base
  ------------------------------------------------------------------
  v_total_to_reserve := p_qty_in_base_units + p_over_sell_quantity;

  ------------------------------------------------------------------
  -- FIX: Validar que el stock disponible >= total a reservar
  --      (solo para la parte normal, no el oversell)
  -- FOR UPDATE lock previene TOCTOU: dos reservas concurrentes
  -- leyendo el mismo disponible y ambas pasando la validación
  ------------------------------------------------------------------
  select coalesce(quantity, 0) - coalesce(reserved_for_selling_quantity, 0)
  into v_available_qty
  from stock
  where stock_id = v_stock_id
  FOR UPDATE;  -- lock row to prevent TOCTOU race condition

  if v_available_qty is not null and p_qty_in_base_units > 0 and v_available_qty < p_qty_in_base_units then
    raise exception
      'Stock insuficiente para reservar en stock_id=%. Disponible: %, Requerido: %',
      v_stock_id, v_available_qty, p_qty_in_base_units;
  end if;

  ------------------------------------------------------------------
  -- Actualizar reserved_for_selling_quantity
  ------------------------------------------------------------------
  update stock s
  set reserved_for_selling_quantity = coalesce(s.reserved_for_selling_quantity, 0) + v_total_to_reserve,
      updated_at = now()
  where s.stock_id = v_stock_id
  returning s.lot_id into v_lot_id;

  ------------------------------------------------------------------
  -- Actualizar order_item con stock_id y lot_id
  ------------------------------------------------------------------
  update order_items
  set stock_id = v_stock_id,
      lot_id   = v_lot_id
  where order_item_id = p_order_item_id;
end;
$$;
