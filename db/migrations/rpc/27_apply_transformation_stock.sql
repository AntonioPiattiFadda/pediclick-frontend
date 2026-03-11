-- ============================================================
-- MIGRATION: apply_transformation_stock
-- File: 27_apply_transformation_stock.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. This function
-- applies a single transformation step to either the origin stock (subtraction)
-- or a destination stock (addition or new lot creation). All stock ID parameters
-- and internal variables must be updated to uuid. The old 4-param legacy version
-- (with product_presentation_id in lots) and the old 5-param version (with bigint
-- stock IDs) are dropped before re-creation.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_origin_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_existing_stock_id: bigint → uuid  (local variable)
--   - [UUID] v_new_stock_id: bigint → uuid  (local variable)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   apply_transformation_stock(p_is_origin boolean, p_origin_stock_id bigint,
--     p_stock_id bigint, p_quantity numeric, p_location_id bigint,
--     p_lot jsonb) RETURNS jsonb
--
-- NEW SIGNATURE:
--   apply_transformation_stock(p_is_origin boolean, p_origin_stock_id uuid,
--     p_stock_id uuid, p_quantity numeric, p_location_id bigint,
--     p_lot jsonb) RETURNS jsonb
--
-- EXECUTION ORDER: Level 4 — Transformation/transfer, called by transformation_items (28)
-- ============================================================

-- 1. Drop old 4-param legacy (already in 00_drop_legacy but safe to repeat)
DROP FUNCTION IF EXISTS public.apply_transformation_stock(boolean, bigint, numeric, bigint, jsonb);

-- 2. Drop old 5-param signature with bigint stock ids
DROP FUNCTION IF EXISTS public.apply_transformation_stock(boolean, bigint, bigint, numeric, bigint, jsonb);

-- 3. Create updated function
CREATE OR REPLACE FUNCTION public.apply_transformation_stock(p_is_origin boolean, p_origin_stock_id uuid, p_stock_id uuid, p_quantity numeric, p_location_id bigint, p_lot jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_origin_lot_id     bigint;
  v_existing_lot_id   bigint;
  v_existing_stock_id uuid;
  v_new_lot_id        bigint;
  v_new_stock_id      uuid;
begin
  select lot_id into v_origin_lot_id
  from stock
  where stock_id = p_origin_stock_id;

  if v_origin_lot_id is null then
      raise exception 'Origin lot not found for stock_id %', p_origin_stock_id;
  end if;

  -------------------------------------------------------------------
  -- ORIGEN: restar stock y retornar
  -------------------------------------------------------------------
  if p_is_origin is true then
      update stock
      set quantity = quantity - p_quantity
      where stock_id = p_origin_stock_id;

      return jsonb_build_object(
          'lot_id',           v_origin_lot_id,
          'stock_id',         p_origin_stock_id,
          'quantity_applied', -p_quantity
      );
  end if;

  -------------------------------------------------------------------
  -- DESTINO: buscar lote ya existente desde este origen
  -------------------------------------------------------------------
  select l.lot_id, s.stock_id
  into v_existing_lot_id, v_existing_stock_id
  from lot_traces t
  join lots  l on l.lot_id = t.lot_to_id
  join stock s on s.lot_id = l.lot_id
  where t.lot_from_id = v_origin_lot_id
    and l.product_id  = (p_lot->>'product_id')::bigint
    and s.location_id = p_location_id
  limit 1;

  -------------------------------------------------------------------
  -- Reusar lote existente
  -------------------------------------------------------------------
  if v_existing_stock_id is not null then
      update stock
      set quantity = quantity + p_quantity
      where stock_id = v_existing_stock_id;

      return jsonb_build_object(
          'lot_id',           v_existing_lot_id,
          'stock_id',         v_existing_stock_id,
          'quantity_applied', p_quantity,
          'reused_lot',       true
      );
  end if;

  -------------------------------------------------------------------
  -- Crear lote nuevo
  -- Solo se guarda final_cost_per_unit (dato atómico).
  -- final_cost_total = final_cost_per_unit × initial_stock_quantity → on the fly
  -------------------------------------------------------------------
  insert into lots (
      product_id,
      provider_id,
      expiration_date,
      expiration_date_notification,
      initial_stock_quantity,
      final_cost_per_unit
  )
  values (
      (p_lot->>'product_id')::bigint,
      (p_lot->>'provider_id')::bigint,
      (p_lot->>'expiration_date')::timestamptz,
      (p_lot->>'expiration_date_notification')::boolean,
      p_quantity,
      (p_lot->>'final_cost_per_unit')::numeric
  )
  returning lot_id into v_new_lot_id;

  insert into stock (lot_id, quantity, stock_type, product_id, location_id)
  values (v_new_lot_id, p_quantity, 'STORE', (p_lot->>'product_id')::bigint, p_location_id)
  returning stock_id into v_new_stock_id;

  perform public.create_lot_trace(v_origin_lot_id, v_new_lot_id);

  return jsonb_build_object(
      'lot_id',           v_new_lot_id,
      'stock_id',         v_new_stock_id,
      'quantity_applied', p_quantity,
      'reused_lot',       false
  );
end;
$$;
