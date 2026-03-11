-- ============================================================
-- MIGRATION: resolve_oversell_stock
-- File: 06_resolve_oversell_stock.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. The internal
-- v_stock_id variable and the returned JSONB must reflect the new type. A logic
-- bug was also fixed: the original function selected the lot to associate with
-- an oversell using only product_id, meaning it could incorrectly associate the
-- oversell with a lot belonging to a different location. The fix adds a JOIN
-- through stock filtered by location_id. Additionally, SECURITY DEFINER without
-- a pinned search_path is vulnerable to search_path injection attacks — the
-- SET search_path TO 'public' clause was added to close that vulnerability.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [LOGIC FIX] Lot lookup now filters by location_id via JOIN to stock,
--     preventing cross-location oversell association
--   - [SECURITY] Added SET search_path TO 'public' (SECURITY DEFINER without
--     pinned search_path is vulnerable to search path injection)
--
-- OLD SIGNATURE:
--   resolve_oversell_stock(p_product_id bigint, p_location_id bigint,
--     p_over_sell_quantity numeric) RETURNS jsonb
--
-- NEW SIGNATURE:
--   resolve_oversell_stock(p_product_id bigint, p_location_id bigint,
--     p_over_sell_quantity numeric) RETURNS jsonb
--   (same external signature; internal types and security settings updated)
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old 2-param (3-param in new naming) signature with bigint stock return
DROP FUNCTION IF EXISTS public.resolve_oversell_stock(bigint, bigint, numeric);

-- Also drop old 4-param legacy (already in 00_drop_legacy_functions.sql but safe to repeat)
DROP FUNCTION IF EXISTS public.resolve_oversell_stock(bigint, bigint, bigint, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.resolve_oversell_stock(p_product_id bigint, p_location_id bigint, p_over_sell_quantity numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_lot_id   bigint;
  v_stock_id uuid;
begin
  ------------------------------------------------------------------
  -- 1. Buscar lote que YA tenga stock en la location
  --    FIX: filtrar por location_id para no asociar oversell a un
  --    lote de otra ubicación (bug original: solo filtraba product_id)
  ------------------------------------------------------------------
  select l.lot_id
  into v_lot_id
  from stock s
  join lots l on l.lot_id = s.lot_id
  where l.product_id = p_product_id
    and s.location_id = p_location_id
  order by l.created_at desc
  limit 1;

  ------------------------------------------------------------------
  -- 2. Si no existe lote con stock en esta location → crear uno nuevo
  ------------------------------------------------------------------
  if v_lot_id is null then
    insert into lots (
      product_id,
      created_at
    )
    values (
      p_product_id,
      now()
    )
    returning lot_id into v_lot_id;
  end if;

  ------------------------------------------------------------------
  -- 3. Buscar stock del lote en la location
  ------------------------------------------------------------------
  select s.stock_id
  into v_stock_id
  from stock s
  where s.lot_id = v_lot_id
    and s.location_id = p_location_id
  limit 1;

  ------------------------------------------------------------------
  -- 4. Si no existe stock → crearlo
  ------------------------------------------------------------------
  if v_stock_id is null then
    insert into stock (
      lot_id,
      location_id,
      quantity,
      over_sell_quantity,
      created_at
    )
    values (
      v_lot_id,
      p_location_id,
      0,
      p_over_sell_quantity,
      now()
    )
    returning stock_id into v_stock_id;
  else
    update stock s
    set over_sell_quantity = coalesce(s.over_sell_quantity, 0) + p_over_sell_quantity,
        updated_at = now()
    where s.stock_id = v_stock_id;
  end if;

  return jsonb_build_object(
    'lot_id', v_lot_id,
    'stock_id', v_stock_id
  );
end;
$$;
