-- ============================================================
-- MIGRATION: assign_stock_to_location
-- File: 10_assign_stock_to_location.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` and `stock_movements` tables migrated their primary keys from
-- bigint to uuid. Internal variables v_from_stock_id and v_stock_movement_id
-- are updated accordingly. The function reads stock_id from JSONB input, which
-- must now be cast to uuid instead of bigint. All calls to sub-functions
-- (subtract_stock_quantity) that now expect uuid are automatically compatible.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_from_stock_id: bigint → uuid  (reason: stock PK migrated;
--     read from p_from_stock_data->>'stock_id' cast to ::uuid)
--   - [UUID] v_stock_movement_id: bigint → uuid  (reason: stock_movements PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--   - [KNOWN RISK] Deadlock possible if two concurrent transfers go A→B and B→A
--     simultaneously, because the function locks source stock then destination stock.
--     See comment inside the function for details and TODO.
--
-- OLD SIGNATURE:
--   assign_stock_to_location(p_from_stock_data jsonb, p_stock_movement jsonb) RETURNS jsonb
--
-- NEW SIGNATURE:
--   assign_stock_to_location(p_from_stock_data jsonb, p_stock_movement jsonb) RETURNS jsonb
--   (same external signature; internal variable types updated)
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, calls subtract_stock_quantity (01)
-- ============================================================

-- 1. Drop old signature (same external params, internal vars change)
DROP FUNCTION IF EXISTS public.assign_stock_to_location(jsonb, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.assign_stock_to_location(p_from_stock_data jsonb, p_stock_movement jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_from_stock_id uuid := (p_from_stock_data->>'stock_id')::uuid;

  v_product_id bigint;
  v_stock record;
  v_to_stock record;

  v_stock_movement_id uuid;
  v_quantity numeric := (p_stock_movement->>'quantity')::numeric;
  v_to_location_id bigint := (p_stock_movement->>'to_location_id')::bigint;
  v_product_presentation_id bigint := (p_stock_movement->>'product_presentation_id')::bigint;
  v_created_by uuid := (p_stock_movement->>'created_by')::uuid;

  v_bulk_qty_eq numeric;
  v_quantity_base_units numeric;
begin

  ---------------------------------------------------------------------------
  -- 1. Obtener bulk_quantity_equivalence de la presentación
  ---------------------------------------------------------------------------
  select bulk_quantity_equivalence
  into v_bulk_qty_eq
  from product_presentations
  where product_presentation_id = v_product_presentation_id;

  if not found or v_bulk_qty_eq is null then
    raise exception 'Presentación % no encontrada o sin bulk_quantity_equivalence', v_product_presentation_id;
  end if;

  v_quantity_base_units := v_quantity * v_bulk_qty_eq;

  ---------------------------------------------------------------------------
  -- 2. Obtener stock origen
  ---------------------------------------------------------------------------
  select *
  into v_stock
  from stock
  where stock_id = v_from_stock_id
  for update;

  if not found then
    raise exception 'Stock not found (id=%)', v_from_stock_id;
  end if;

  v_product_id := v_stock.product_id;

  ---------------------------------------------------------------------------
  -- 3. Insertar movimiento
  ---------------------------------------------------------------------------
  insert into stock_movements (
    lot_id,
    movement_type,
    quantity,
    from_location_id,
    to_location_id,
    stock_id,
    product_presentation_id,
    created_by,
    created_at
  )
  values (
    v_stock.lot_id,
    'TRANSFER',
    v_quantity_base_units,
    v_stock.location_id,
    v_to_location_id,
    v_from_stock_id,
    v_product_presentation_id,
    v_created_by,
    now()
  )
  returning stock_movement_id into v_stock_movement_id;

  ---------------------------------------------------------------------------
  -- 4. Restar stock origen
  ---------------------------------------------------------------------------
  perform subtract_stock_quantity(v_from_stock_id, v_quantity_base_units);

  ---------------------------------------------------------------------------
  -- 5. Sumar o compensar stock destino (OVERSALE SAFE)
  -- ⚠️ KNOWN RISK: If two concurrent transfers go A→B and B→A simultaneously,
  -- a deadlock is possible because this function locks source stock then destination stock.
  -- TODO: Acquire both locks in stock_id ASC order to eliminate the risk.
  -- For now, PostgreSQL's deadlock detector will resolve these cases via rollback+retry.
  ---------------------------------------------------------------------------
  select *
  into v_to_stock
  from stock
  where lot_id = v_stock.lot_id
    and product_id = v_product_id
    and location_id = v_to_location_id
  for update;

  if found then
    update stock
    set
      quantity = quantity + greatest(0, v_quantity_base_units - v_to_stock.over_sell_quantity),
      over_sell_quantity = greatest(0, v_to_stock.over_sell_quantity - v_quantity_base_units),
      updated_at = now()
    where stock_id = v_to_stock.stock_id;
  else
    insert into stock (
      lot_id,
      product_id,
      location_id,
      quantity,
      over_sell_quantity,
      updated_at
    )
    values (
      v_stock.lot_id,
      v_product_id,
      v_to_location_id,
      v_quantity_base_units,
      0,
      now()
    );
  end if;

  return jsonb_build_object('success', true, 'stock_movement_id', v_stock_movement_id);
end;
$$;
