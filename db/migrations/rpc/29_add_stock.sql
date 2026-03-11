-- ============================================================
-- MIGRATION: add_stock
-- File: 29_add_stock.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- Two fixes were applied to this function. First, PgBouncer in transaction
-- pooling mode does not support TEMP TABLE creation inside functions because
-- temporary tables are session-scoped and PgBouncer reuses connections across
-- transactions. The TEMP TABLE used to stage lot_containers data was replaced
-- with a CTE (WITH ... AS (...)) which is scoped to the query and works
-- correctly under PgBouncer. Second, the client_id field in the
-- lot_containers_location JSONB was previously cast to ::bigint, but the
-- `clients` table migrated its PK to uuid, so the cast must be ::uuid.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [PGBOUNCER] Replaced CREATE TEMP TABLE ... ON COMMIT DROP with a CTE
--     (WITH tmp_lc AS (...)) to support PgBouncer transaction pooling mode
--   - [UUID] client_id in lot_containers_location JSONB: ::bigint → ::uuid
--     (reason: clients PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   add_stock(p_lot jsonb, p_stocks jsonb, p_lot_containers_location jsonb,
--     p_organization_id uuid) RETURNS jsonb
--
-- NEW SIGNATURE:
--   add_stock(p_lot jsonb, p_stocks jsonb, p_lot_containers_location jsonb,
--     p_organization_id uuid) RETURNS jsonb
--   (same external signature; PgBouncer fix and uuid cast applied internally)
--
-- EXECUTION ORDER: Level 4 — Transformation/transfer, calls compensate_over_sell_lots (13)
-- ============================================================

-- 1. Drop old signature (same params, logic fix)
DROP FUNCTION IF EXISTS public.add_stock(jsonb, jsonb, jsonb, uuid);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.add_stock(p_lot jsonb, p_stocks jsonb, p_lot_containers_location jsonb, p_organization_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_lot_id         bigint;
    v_result         jsonb := '{}'::jsonb;
    v_checked        jsonb;
    v_lot_checked    jsonb;
    v_stocks_checked jsonb;
    v_lc_checked     jsonb;
begin
    if exists (
        select 1 from jsonb_array_elements(p_stocks) s
        where coalesce((s->>'has_to_compensate')::boolean, false) = true
    ) then
        v_checked := public.compensate_over_sell_lots(
            p_lot, p_stocks, p_lot_containers_location, p_organization_id
        );
    else
        v_checked := jsonb_build_object(
            'lot',                    p_lot,
            'stocks',                 p_stocks,
            'lot_containers_location', p_lot_containers_location,
            'continue',               true
        );
    end if;

    if (v_checked->>'continue')::boolean is not true then
        return jsonb_build_object('lot_id', null, 'skipped', true);
    end if;

    v_lot_checked    := v_checked->'lot';
    v_stocks_checked := v_checked->'stocks';
    v_lc_checked     := v_checked->'lot_containers_location';

    ---------------------------------------------------------------------------
    -- INSERT lot
    -- Solo *_per_unit. Los totales y los per_bulk se calculan on the fly:
    --   *_total     = *_per_unit × initial_stock_quantity
    --   *_per_bulk  = *_per_unit × bulk_quantity_equivalence
    ---------------------------------------------------------------------------
    insert into lots (
        load_order_id,
        product_id,
        expiration_date,
        expiration_date_notification,
        provider_id,
        initial_stock_quantity,
        purchase_cost_per_unit,
        download_cost_per_unit,
        delivery_cost_per_unit,
        extra_cost_per_unit,
        final_cost_per_unit,
        is_sold_out,
        is_expired,
        created_at
    )
    values (
        nullif(v_lot_checked->>'load_order_id', '')::bigint,
        (v_lot_checked->>'product_id')::bigint,
        nullif(v_lot_checked->>'expiration_date', '')::timestamptz,
        (v_lot_checked->>'expiration_date_notification')::boolean,
        nullif(v_lot_checked->>'provider_id', '')::bigint,
        (v_lot_checked->>'initial_stock_quantity')::numeric,
        (v_lot_checked->>'purchase_cost_per_unit')::numeric,
        (v_lot_checked->>'download_cost_per_unit')::numeric,
        (v_lot_checked->>'delivery_cost_per_unit')::numeric,
        (v_lot_checked->>'extra_cost_per_unit')::numeric,
        (v_lot_checked->>'final_cost_per_unit')::numeric,
        false,
        false,
        now()
    )
    returning lot_id into v_lot_id;

    ---------------------------------------------------------------------------
    -- INSERT stock
    ---------------------------------------------------------------------------
    insert into stock (
        lot_id,
        product_id,
        location_id,
        quantity,
        min_notification,
        max_notification,
        stock_type,
        reserved_for_transferring_quantity,
        reserved_for_selling_quantity,
        transformed_from_product_id,
        transformed_to_product_id,
        created_at
    )
    select
        v_lot_id,
        (s->>'product_id')::bigint,
        nullif(s->>'location_id', '')::bigint,
        (s->>'quantity')::numeric,
        (s->>'min_notification')::numeric,
        (s->>'max_notification')::numeric,
        (s->>'stock_type')::stock_type,
        (s->>'reserved_for_transferring_quantity')::numeric,
        (s->>'reserved_for_selling_quantity')::numeric,
        nullif(s->>'transformed_from_product_id', '')::bigint,
        nullif(s->>'transformed_to_product_id', '')::bigint,
        now()
    from jsonb_array_elements(v_stocks_checked) s;

    ---------------------------------------------------------------------------
    -- INSERT lot_containers_stock
    -- FIX: replace CREATE TEMP TABLE ... ON COMMIT DROP with CTE
    --      (compatible with PgBouncer transaction pooling mode)
    -- FIX: client_id cast from ::bigint -> ::uuid (uuid after migration)
    ---------------------------------------------------------------------------
    with tmp_lc as (
      select
        (lc->>'lot_container_id')::bigint      as lot_container_id,
        nullif(lc->>'location_id', '')::bigint as location_id,
        (lc->>'quantity')::numeric             as quantity,
        nullif(lc->>'client_id', '')::uuid     as client_id,
        nullif(lc->>'provider_id', '')::bigint as provider_id
      from jsonb_array_elements(v_lc_checked) lc
    )
    insert into lot_containers_stock (
        organization_id, stock_id, lot_container_id,
        quantity, created_at, location_id, client_id, provider_id
    )
    select
        p_organization_id,
        (
            select s.stock_id from stock s
            where s.lot_id = v_lot_id
              and coalesce(s.location_id, -1) = coalesce(lc.location_id, -1)
            limit 1
        ),
        lc.lot_container_id,
        lc.quantity,
        now(),
        lc.location_id,
        lc.client_id,
        lc.provider_id
    from tmp_lc lc;

    return jsonb_build_object('lot_id', v_lot_id);

exception
    when others then raise;
end;
$$;
