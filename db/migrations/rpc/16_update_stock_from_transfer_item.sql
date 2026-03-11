-- ============================================================
-- MIGRATION: update_stock_from_transfer_item
-- File: 16_update_stock_from_transfer_item.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. This function
-- adjusts reserved_for_transferring_quantity on a stock row when a transfer
-- order item is edited (delta between new and previous quantity). The p_stock_id
-- parameter must be updated to uuid to match the new PK type.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   update_stock_from_transfer_item(p_stock_id bigint, p_new_qty numeric,
--     p_prev_qty numeric DEFAULT 0) RETURNS void
--
-- NEW SIGNATURE:
--   update_stock_from_transfer_item(p_stock_id uuid, p_new_qty numeric,
--     p_prev_qty numeric DEFAULT 0) RETURNS void
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, no calls to other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.update_stock_from_transfer_item(bigint, numeric, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.update_stock_from_transfer_item(p_stock_id uuid, p_new_qty numeric, p_prev_qty numeric DEFAULT 0) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_delta numeric;
begin
  -- If previous qty is null, assume it's a new item
  p_prev_qty := coalesce(p_prev_qty, 0);

  -- Difference between new and old quantity
  v_delta := p_new_qty - p_prev_qty;

  -- Update reserved quantity for transfers
  update public.stock
  set
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) + v_delta,
    updated_at = now()
  where stock_id = p_stock_id;

end;
$$;
