-- ============================================================
-- MIGRATION: stock_to_transfer_item
-- File: 15_stock_to_transfer_item.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. The internal
-- variable v_stock_id, which holds the looked-up or newly created destination
-- stock ID, must be updated from bigint to uuid. The old 6-param legacy version
-- (with store_id/stock_room_id) is also dropped here for safety, though it
-- should already be gone after file 00. The external signature is unchanged
-- since it does not expose stock_id to the caller.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_stock_id: bigint → uuid  (local variable; reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   stock_to_transfer_item(p_stock_type stock_type, p_location_id bigint,
--     p_quantity numeric, p_product_id bigint, p_lot_id bigint) RETURNS void
--
-- NEW SIGNATURE:
--   stock_to_transfer_item(p_stock_type stock_type, p_location_id bigint,
--     p_quantity numeric, p_product_id bigint, p_lot_id bigint) RETURNS void
--   (same external signature; internal variable type updated)
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, no calls to other RPCs
-- ============================================================

-- 1. Drop old version with store_id/stock_room_id (already in 00_drop_legacy but safe to repeat)
DROP FUNCTION IF EXISTS public.stock_to_transfer_item(stock_type, bigint, bigint, numeric, bigint, bigint);

-- 2. Drop the current version so we can recreate with uuid internal var
DROP FUNCTION IF EXISTS public.stock_to_transfer_item(stock_type, bigint, numeric, bigint, bigint);

-- 3. Create updated function
CREATE OR REPLACE FUNCTION public.stock_to_transfer_item(p_stock_type public.stock_type, p_location_id bigint, p_quantity numeric, p_product_id bigint, p_lot_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_stock_id uuid;
begin
  ---------------------------------------------------------------------
  -- Validación obligatoria
  ---------------------------------------------------------------------
  if p_location_id is null then
    raise exception
      'stock_to_transfer_item: p_location_id cannot be NULL (product_id=%, lot_id=%)',
      p_product_id,
      p_lot_id
      using errcode = '23502';
  end if;

  ---------------------------------------------------------------------
  -- 1. Buscar stock destino según (location_id, lot)
  ---------------------------------------------------------------------
  select stock_id
  into v_stock_id
  from public.stock
  where location_id = p_location_id
    and lot_id = p_lot_id
  limit 1;

  ---------------------------------------------------------------------
  -- 2. Si el stock destino existe → actualizar cantidades
  ---------------------------------------------------------------------
  if v_stock_id is not null then
    update public.stock
    set
      quantity = coalesce(quantity, 0) + coalesce(p_quantity, 0),

      -- restar reservas existentes
      reserved_for_transferring_quantity =
        coalesce(reserved_for_transferring_quantity, 0) - coalesce(p_quantity, 0),

      updated_at = now()
    where stock_id = v_stock_id;

    return;
  end if;

  ---------------------------------------------------------------------
  -- 3. Si NO existe → crear stock destino
  ---------------------------------------------------------------------
  insert into public.stock (
    location_id,
    product_id,
    lot_id,
    quantity,
    reserved_for_transferring_quantity,
    created_at,
    updated_at
  )
  values (
    p_location_id,
    p_product_id,
    p_lot_id,
    coalesce(p_quantity, 0),

    -- Nuevo stock → no tiene reservas previas
    0,

    now(),
    now()
  );
end;
$$;
