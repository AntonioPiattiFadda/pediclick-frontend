-- ============================================================
-- MIGRATION: stock_from_transfer_item
-- File: 14_stock_from_transfer_item.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. This function
-- reduces both quantity and reserved_for_transferring_quantity on a source stock
-- row when a transfer item is finalized. The p_stock_id parameter must be
-- updated to uuid to match the new PK type. No logic changes were needed;
-- the function intentionally allows negative values (without greatest()) to
-- surface any data inconsistencies.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   stock_from_transfer_item(p_stock_id bigint, p_quantity numeric) RETURNS void
--
-- NEW SIGNATURE:
--   stock_from_transfer_item(p_stock_id uuid, p_quantity numeric) RETURNS void
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, no calls to other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.stock_from_transfer_item(bigint, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.stock_from_transfer_item(p_stock_id uuid, p_quantity numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  ---------------------------------------------------------------------
  -- Restar directamente la cantidad transferida:
  --    - quantity
  --    - reserved_for_transfering_quantity
  -- Valores negativos permitidos (sin greatest())
  ---------------------------------------------------------------------

  update public.stock
  set
    quantity = coalesce(quantity, 0) - coalesce(p_quantity, 0),
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) - coalesce(p_quantity, 0),
    updated_at = now()
  where stock_id = p_stock_id;
end;
$$;
