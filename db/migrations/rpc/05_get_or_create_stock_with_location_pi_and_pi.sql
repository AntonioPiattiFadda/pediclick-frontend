-- ============================================================
-- MIGRATION: get_or_create_stock_with_location_pi_and_pi
-- File: 05_get_or_create_stock_with_location_pi_and_pi.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. This function
-- looks up or creates a stock row for a given (product_id, location_id) pair and
-- must return a uuid. Two concurrency bugs were also fixed: (1) the SELECT used
-- a plain JOIN which could lock both tables, replaced with FOR UPDATE OF s to
-- lock only the stock row and avoid deadlocks with lot-level locks; (2) if two
-- transactions both find v_stock_id IS NULL simultaneously, both will attempt to
-- INSERT a lot — an EXCEPTION handler on unique_violation lets the second
-- transaction safely re-select the already-inserted stock instead of failing.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] RETURNS bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_stock_id: bigint → uuid  (local variable)
--   - [LOGIC FIX] FOR UPDATE changed to FOR UPDATE OF s on the stock+lots JOIN
--     to lock only the stock row, preventing deadlocks with concurrent lot locks
--   - [LOGIC FIX] Added EXCEPTION WHEN unique_violation handler around lot INSERT
--     to handle race condition where two transactions both try to create the same lot
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   get_or_create_stock_with_location_pi_and_pi(p_product_id bigint,
--     p_location_id bigint) RETURNS bigint
--
-- NEW SIGNATURE:
--   get_or_create_stock_with_location_pi_and_pi(p_product_id bigint,
--     p_location_id bigint) RETURNS uuid
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old 2-param signature returning bigint
DROP FUNCTION IF EXISTS public.get_or_create_stock_with_location_pi_and_pi(bigint, bigint);

-- Also drop old 3-param legacy (already in 00_drop_legacy_functions.sql but safe to repeat)
DROP FUNCTION IF EXISTS public.get_or_create_stock_with_location_pi_and_pi(bigint, bigint, bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.get_or_create_stock_with_location_pi_and_pi(p_product_id bigint, p_location_id bigint) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_stock_id uuid;
  v_lot_id   bigint;
begin
  ------------------------------------------------------------------
  -- Buscar último stock existente (solo por product_id + location_id)
  -- FOR UPDATE OF s previene race condition: dos transacciones simultáneas
  -- ambas viendo v_stock_id = null e insertando duplicados.
  -- Se usa OF s (no OF s, l) para bloquear solo la fila de stock
  -- y evitar deadlocks con bloqueos a nivel de lot.
  ------------------------------------------------------------------
  SELECT s.stock_id INTO v_stock_id
  FROM stock s
  JOIN lots l ON l.lot_id = s.lot_id
  WHERE l.product_id = p_product_id
    AND s.location_id = p_location_id
  ORDER BY l.created_at DESC
  LIMIT 1
  FOR UPDATE OF s;

  ------------------------------------------------------------------
  -- Si existe → retornar
  ------------------------------------------------------------------
  if v_stock_id is not null then
    return v_stock_id;
  end if;

  ------------------------------------------------------------------
  -- Si no existe → crear lote + stock
  -- EXCEPTION handler en unique_violation: si otra transacción
  -- insertó el lote al mismo tiempo, re-seleccionamos el stock
  -- existente en lugar de fallar con un error de duplicado.
  ------------------------------------------------------------------
  BEGIN
    insert into lots (
      product_id,
      created_at
    )
    values (p_product_id, now())
    returning lot_id into v_lot_id;
  EXCEPTION WHEN unique_violation THEN
    -- Another transaction inserted first — re-select existing stock
    SELECT s.stock_id INTO v_stock_id
    FROM stock s JOIN lots l ON l.lot_id = s.lot_id
    WHERE l.product_id = p_product_id AND s.location_id = p_location_id
    ORDER BY l.created_at DESC LIMIT 1;
    RETURN v_stock_id;
  END;

  insert into stock (lot_id, location_id, quantity, reserved_for_selling_quantity, created_at)
  values (v_lot_id, p_location_id, 0, 0, now())
  on conflict (lot_id, location_id) do nothing
  returning stock_id into v_stock_id;

  -- If conflict occurred, fetch the existing stock_id
  if v_stock_id is null then
    select stock_id
    into v_stock_id
    from stock
    where lot_id = v_lot_id
      and location_id = p_location_id;
  end if;

  return v_stock_id;
end;
$$;
