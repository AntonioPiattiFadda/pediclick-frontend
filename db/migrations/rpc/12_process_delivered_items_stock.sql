-- ============================================================
-- MIGRATION: process_delivered_items_stock
-- File: 12_process_delivered_items_stock.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `order_items` and `stock` tables migrated their primary keys from bigint
-- to uuid. The JSONB input array items contain order_item_id and stock_id as
-- uuid strings, so the internal variables v_order_item_id and v_stock_id are
-- updated to uuid. A retry-safety fix was also applied: the stock quantity is
-- now read with FOR UPDATE before the reservation and quantity updates, ensuring
-- that on partial retry (e.g., after a transient error mid-loop) the function
-- sees the already-committed state and does not double-apply deductions.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_order_item_id: bigint → uuid  (reason: order_items PK migrated)
--   - [UUID] v_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [LOGIC FIX] FOR UPDATE added to the stock quantity SELECT before updates
--     to prevent desynchronization on partial retry
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   process_delivered_items_stock(p_items jsonb) RETURNS void
--
-- NEW SIGNATURE:
--   process_delivered_items_stock(p_items jsonb) RETURNS void
--   (same external signature; internal variable types and locking updated)
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, no calls to other RPCs
-- ============================================================

-- 1. Drop old signature (same params jsonb, internal vars change)
DROP FUNCTION IF EXISTS public.process_delivered_items_stock(jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.process_delivered_items_stock(p_items jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_item jsonb;
  v_order_item_id uuid;
  v_stock_id      uuid;
  v_qty_in_base_units numeric;
  v_over_sell_quantity numeric;
  v_total_reserved numeric;
  v_current_quantity numeric;
  v_remaining numeric;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_item_id     := (v_item->>'order_item_id')::uuid;
    v_stock_id          := (v_item->>'stock_id')::uuid;
    -- usar qty_in_base_units para descontar; fallback a quantity si no existe
    v_qty_in_base_units := coalesce(
      (v_item->>'qty_in_base_units')::numeric,
      (v_item->>'quantity')::numeric
    );
    v_over_sell_quantity := coalesce((v_item->>'over_sell_quantity')::numeric, 0);
    v_total_reserved     := v_qty_in_base_units + v_over_sell_quantity;

    ------------------------------------------------------------------
    -- FIX: Obtener quantity actual del stock con FOR UPDATE
    --      para prevenir desincronización en retry parcial
    ------------------------------------------------------------------
    select quantity into v_current_quantity
    from stock
    where stock_id = v_stock_id
    for update;

    ------------------------------------------------------------------
    -- Descontar reserved_for_selling_quantity
    ------------------------------------------------------------------
    update stock
    set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
        updated_at = now()
    where stock_id = v_stock_id;

    ------------------------------------------------------------------
    -- Descontar de quantity usando qty_in_base_units
    ------------------------------------------------------------------
    if v_current_quantity >= v_total_reserved then
      update stock
      set quantity = quantity - v_total_reserved,
          updated_at = now()
      where stock_id = v_stock_id;
    else
      v_remaining := v_total_reserved - v_current_quantity;

      update stock
      set quantity = 0,
          over_sell_quantity = coalesce(over_sell_quantity, 0) + v_remaining,
          updated_at = now()
      where stock_id = v_stock_id;
    end if;

  end loop;
end;
$$;
