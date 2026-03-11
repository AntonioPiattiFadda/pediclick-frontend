-- ============================================================
-- MIGRATION: delete_delivery_order_item
-- File: 25_delete_delivery_order_item.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `order_items` and `stock` tables migrated their primary keys from bigint
-- to uuid. Parameters p_order_item_id and p_stock_id must be updated to uuid.
-- A unit-consistency bug was also fixed: the original function used the display
-- quantity (quantity) to calculate how much reserved stock to release, but the
-- reservation was made in base units (qty_in_base_units). Using the wrong unit
-- leaves residual reservations and causes incorrect available-stock calculations.
-- The fix uses qty_in_base_units for the total_reserved calculation.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_order_item_id: bigint → uuid  (reason: order_items PK migrated)
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [LOGIC FIX] Use qty_in_base_units instead of quantity for v_total_reserved
--     calculation, ensuring unit consistency with the original reservation
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   delete_delivery_order_item(p_order_item_id bigint, p_stock_id bigint) RETURNS void
--
-- NEW SIGNATURE:
--   delete_delivery_order_item(p_order_item_id uuid, p_stock_id uuid) RETURNS void
--
-- EXECUTION ORDER: Level 3 — Main function, no calls to other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.delete_delivery_order_item(bigint, bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.delete_delivery_order_item(p_order_item_id uuid, p_stock_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_qty_in_base_units  numeric;
  v_over_sell_quantity numeric;
  v_total_reserved     numeric;
begin
  ------------------------------------------------------------------
  -- Obtener cantidades del order_item
  -- FIX: usar qty_in_base_units en lugar de quantity para calcular
  --      v_total_reserved (consistencia de unidades)
  ------------------------------------------------------------------
  select qty_in_base_units, over_sell_quantity
  into v_qty_in_base_units, v_over_sell_quantity
  from order_items
  where order_item_id = p_order_item_id;

  if not found then
    raise exception 'Order item % no encontrado', p_order_item_id;
  end if;

  v_total_reserved := coalesce(v_qty_in_base_units, 0) + coalesce(v_over_sell_quantity, 0);

  ------------------------------------------------------------------
  -- Actualizar status a CANCELLED
  ------------------------------------------------------------------
  update order_items
  set status = 'CANCELLED',
      updated_at = now()
  where order_item_id = p_order_item_id;

  ------------------------------------------------------------------
  -- Descontar reserved_for_selling_quantity
  ------------------------------------------------------------------
  update stock
  set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
      updated_at = now()
  where stock_id = p_stock_id;
end;
$$;
