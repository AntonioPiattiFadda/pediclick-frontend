-- ============================================================
-- MIGRATION: compensate_over_sell_lots
-- File: 13_compensate_over_sell_lots.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. The internal
-- variable v_last_stock_id (obtained from get_last_over_sell_stock, which now
-- returns uuid) must be updated accordingly. A null-safety bug was also fixed:
-- when a JSONB quantity field is missing or null in the incoming p_stocks array,
-- the original code would produce a silent arithmetic error (null - number = null)
-- that would propagate incorrect quantities into the lot INSERT. COALESCE(..., 0)
-- is now applied to all quantity reads from JSONB.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_last_stock_id: bigint → uuid  (reason: stock PK migrated;
--     obtained from get_last_over_sell_stock which now returns uuid)
--   - [LOGIC FIX] COALESCE(..., 0) added to all quantity fields read from JSONB
--     to prevent silent null propagation when quantity is missing in input
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   compensate_over_sell_lots(p_lot jsonb, p_stocks jsonb,
--     p_lot_containers_location jsonb, p_organization_id uuid) RETURNS jsonb
--
-- NEW SIGNATURE:
--   compensate_over_sell_lots(p_lot jsonb, p_stocks jsonb,
--     p_lot_containers_location jsonb, p_organization_id uuid) RETURNS jsonb
--   (same external signature; internal variable types and null safety updated)
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, calls get_last_over_sell_stock (07)
-- ============================================================

-- 1. Drop old signature (same params, internal vars change)
DROP FUNCTION IF EXISTS public.compensate_over_sell_lots(jsonb, jsonb, jsonb, uuid);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.compensate_over_sell_lots(p_lot jsonb, p_stocks jsonb, p_lot_containers_location jsonb, p_organization_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_last_stock_id uuid;
  v_last_lot_id bigint;
  v_over_sell_qty numeric;

  v_location_id bigint;

  v_new_quantity numeric;
  v_original_quantity numeric;
  v_compensated_this numeric;
  v_compensated_total numeric := 0;

  v_stock jsonb;
  v_stock_arr jsonb := '[]'::jsonb;

begin
  --------------------------------------------------------------------
  -- 1. Location principal del stock entrante
  --------------------------------------------------------------------
  v_location_id :=
    nullif(p_stocks->0->>'location_id','')::bigint;

  --------------------------------------------------------------------
  -- 2. Traer último oversell real
  --------------------------------------------------------------------
  select
    stock_id,
    lot_id,
    over_sell_quantity
  into
    v_last_stock_id,
    v_last_lot_id,
    v_over_sell_qty
  from public.get_last_over_sell_stock(
    (p_lot->>'product_id')::bigint,
    v_location_id
  );

  --------------------------------------------------------------------
  -- 3. Si NO hay oversell → seguir normal
  --------------------------------------------------------------------
  if v_last_stock_id is null then
    return jsonb_build_object(
      'lot', p_lot,
      'stocks', p_stocks,
      'lot_containers_location', p_lot_containers_location,
      'continue', true
    );
  end if;

  --------------------------------------------------------------------
  -- 4. Compensar oversell contra stocks entrantes
  --    FIX: usar COALESCE en todos los campos quantity del JSONB
  --    para evitar explosión silenciosa cuando quantity = null
  --------------------------------------------------------------------
  for v_stock in
    select * from jsonb_array_elements(p_stocks)
  loop
    v_original_quantity := coalesce((v_stock->>'quantity')::numeric, 0);
    v_new_quantity := v_original_quantity;
    v_compensated_this := 0;

    if v_over_sell_qty > 0 then
      v_compensated_this := least(v_original_quantity, v_over_sell_qty);
      v_new_quantity := v_original_quantity - v_compensated_this;
      v_over_sell_qty := v_over_sell_qty - v_compensated_this;
      v_compensated_total := v_compensated_total + v_compensated_this;
    end if;

    v_stock_arr :=
      v_stock_arr ||
      jsonb_build_array(
        jsonb_set(v_stock, '{quantity}', to_jsonb(v_new_quantity))
      );
  end loop;

  --------------------------------------------------------------------
  -- 4.5 Persistir compensación en BD
  --------------------------------------------------------------------
  if v_compensated_total > 0 then
    update stock
    set
      over_sell_quantity = greatest(
        coalesce(over_sell_quantity, 0) - v_compensated_total,
        0
      ),
      updated_at = now()
    where stock_id = v_last_stock_id;

    update lots
    set
      initial_stock_quantity =
        coalesce(initial_stock_quantity, 0) + v_compensated_total
    where lot_id = v_last_lot_id;
  end if;

  --------------------------------------------------------------------
  -- 5. Si todo el stock entrante fue absorbido → cortar
  --------------------------------------------------------------------
  if not exists (
    select 1
    from jsonb_array_elements(v_stock_arr) s
    where coalesce((s->>'quantity')::numeric, 0) > 0
  ) then
    return jsonb_build_object(
      'lot', p_lot,
      'stocks', v_stock_arr,
      'lot_containers_location', p_lot_containers_location,
      'continue', false
    );
  end if;

  --------------------------------------------------------------------
  -- 6. Recalcular quantity real del nuevo lote
  --------------------------------------------------------------------
  return jsonb_build_object(
    'lot',
      jsonb_set(
        p_lot,
        '{initial_stock_quantity}',
        to_jsonb(
          (
            select sum(coalesce((s->>'quantity')::numeric, 0))
            from jsonb_array_elements(v_stock_arr) s
          )
        )
      ),
    'stocks', v_stock_arr,
    'lot_containers_location', p_lot_containers_location,
    'continue', true
  );

end;
$$;
