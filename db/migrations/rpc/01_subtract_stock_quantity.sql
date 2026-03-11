-- ============================================================
-- MIGRATION: subtract_stock_quantity
-- File: 01_subtract_stock_quantity.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid as part of
-- the offline-first sync initiative. This function subtracts a quantity from
-- a stock row by its ID, so the parameter type must be updated to match the
-- new PK type. The function also guards against negative stock after subtraction.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   subtract_stock_quantity(p_stock_id bigint, p_quantity numeric) RETURNS void
--
-- NEW SIGNATURE:
--   subtract_stock_quantity(p_stock_id uuid, p_quantity numeric) RETURNS void
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.subtract_stock_quantity(bigint, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.subtract_stock_quantity(p_stock_id uuid, p_quantity numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_quantity numeric;
begin
  update stock
  set quantity = quantity - p_quantity
  where stock_id = p_stock_id
  returning quantity into v_quantity;

  if not found then
    raise exception 'Stock not found (stock_id=%)', p_stock_id;
  end if;

  if v_quantity < 0 then
    raise exception 'Stock cannot be negative (stock_id=%)', p_stock_id;
  end if;
end;
$$;
