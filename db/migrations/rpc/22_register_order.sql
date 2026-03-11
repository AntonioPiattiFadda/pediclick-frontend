-- ============================================================
-- MIGRATION: register_order
-- File: 22_register_order.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders` table migrated its primary key from bigint to uuid. This
-- top-level orchestration function calls register_order_header (which now
-- returns uuid), then delegates to register_order_items and
-- register_order_payments. The internal v_order_id variable and the TABLE
-- return column order_id must be updated to uuid. No other logic changes
-- are needed since all sub-function calls were already updated in their
-- respective migration files.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_order_id: bigint → uuid  (reason: orders PK migrated)
--   - [RETURNS] RETURNS TABLE(order_id bigint) → RETURNS TABLE(order_id uuid)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   register_order(p_order jsonb, p_order_items jsonb,
--     p_order_payments jsonb) RETURNS TABLE(order_id bigint)
--
-- NEW SIGNATURE:
--   register_order(p_order jsonb, p_order_items jsonb,
--     p_order_payments jsonb) RETURNS TABLE(order_id uuid)
--
-- EXECUTION ORDER: Level 3 — Main function, calls register_order_header (17),
--   register_order_items (18), register_order_payments (19)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.register_order(jsonb, jsonb, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.register_order(p_order jsonb, p_order_items jsonb, p_order_payments jsonb) RETURNS TABLE(order_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_order_id uuid;
begin
  -- 1) HEADER
  v_order_id := public.register_order_header(p_order);

  -- 2) ITEMS (maneja stock)
  perform public.register_order_items(v_order_id, p_order_items);

  -- 3) PAYMENTS (maneja client_transactions)
  perform public.register_order_payments(v_order_id, p_order_payments);

  -- 4) RETURN
  return query select v_order_id;
end;
$$;
