-- ============================================================
-- MIGRATION: get_last_over_sell_stock
-- File: 07_get_last_over_sell_stock.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. This function
-- returns the most recent stock row that has an outstanding oversell quantity for
-- a given (product_id, location_id) pair. The stock_id column in the TABLE
-- return type must be updated from bigint to uuid to match the new schema.
-- The old 3-param legacy version (with product_presentation_id) is also
-- dropped to eliminate overload ambiguity.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] RETURNS TABLE(stock_id): bigint → uuid  (reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   get_last_over_sell_stock(p_product_id bigint, p_location_id bigint)
--     RETURNS TABLE(stock_id bigint, lot_id bigint, over_sell_quantity numeric)
--
-- NEW SIGNATURE:
--   get_last_over_sell_stock(p_product_id bigint, p_location_id bigint)
--     RETURNS TABLE(stock_id uuid, lot_id bigint, over_sell_quantity numeric)
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old 2-param signature (returning bigint stock_id)
DROP FUNCTION IF EXISTS public.get_last_over_sell_stock(bigint, bigint);

-- Also drop old 3-param legacy (already in 00_drop_legacy_functions.sql but safe to repeat)
DROP FUNCTION IF EXISTS public.get_last_over_sell_stock(bigint, bigint, bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.get_last_over_sell_stock(p_product_id bigint, p_location_id bigint) RETURNS TABLE(stock_id uuid, lot_id bigint, over_sell_quantity numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  return query
  select
    s.stock_id,
    s.lot_id,
    coalesce(s.over_sell_quantity, 0)
  from stock s
  join lots l on l.lot_id = s.lot_id
  where l.product_id = p_product_id
    and s.location_id = p_location_id
    and coalesce(s.over_sell_quantity, 0) > 0
  order by l.created_at desc
  limit 1;
end;
$$;
