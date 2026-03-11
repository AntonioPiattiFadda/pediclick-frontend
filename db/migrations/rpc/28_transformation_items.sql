-- ============================================================
-- MIGRATION: transformation_items
-- File: 28_transformation_items.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. Internal
-- variables v_origin_stock_id and v_final_stock_id are updated to uuid since
-- they hold stock IDs read from JSONB input or returned by
-- apply_transformation_stock. A validation bug was also fixed: the original
-- function processed all transformation items (subtracting from origin and
-- adding to destinations) without first checking whether the total destination
-- quantity exceeds the available origin quantity, making it possible to create
-- negative stock silently. The fix adds a pre-loop validation that raises an
-- exception if sum(destination quantities) > origin quantity.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_origin_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_final_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [LOGIC FIX] Pre-loop validation added: raises exception if
--     sum(destination quantities) > origin quantity before any mutations
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   transformation_items(p_transformation_id bigint, p_items jsonb) RETURNS jsonb
--
-- NEW SIGNATURE:
--   transformation_items(p_transformation_id bigint, p_items jsonb) RETURNS jsonb
--   (same external signature; internal variable types and validation updated)
--
-- EXECUTION ORDER: Level 4 — Transformation/transfer, calls apply_transformation_stock (27)
-- ============================================================

-- 1. Drop old signature (same params, internal vars change)
DROP FUNCTION IF EXISTS public.transformation_items(bigint, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.transformation_items(p_transformation_id bigint, p_items jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    rec               jsonb;
    v_origin_stock_id uuid;
    v_stock_result    jsonb;
    v_final_lot_id    bigint;
    v_final_stock_id  uuid;
    v_detail_id       bigint;
    v_results         jsonb := '[]'::jsonb;

    v_origin_quantity   numeric;
    v_dest_total        numeric;
begin
    -------------------------------------------------------------------
    -- 1. Detectar el stock ORIGEN
    -------------------------------------------------------------------
    select (item->>'stock_id')::uuid
    into v_origin_stock_id
    from jsonb_array_elements(p_items) item
    where (item->>'is_origin')::boolean = true
    limit 1;

    if v_origin_stock_id is null then
        raise exception 'No origin stock found in transformation items';
    end if;

    -------------------------------------------------------------------
    -- FIX: Validar suma(quantity destino) <= quantity origen
    --      antes de procesar cualquier item
    -------------------------------------------------------------------
    select quantity
    into v_origin_quantity
    from stock
    where stock_id = v_origin_stock_id;

    select coalesce(sum((item->>'quantity')::numeric), 0)
    into v_dest_total
    from jsonb_array_elements(p_items) item
    where (item->>'is_origin')::boolean = false;

    if v_dest_total > v_origin_quantity then
        raise exception
          'Suma de cantidades destino (%) supera la cantidad origen (%) en stock_id=%',
          v_dest_total, v_origin_quantity, v_origin_stock_id;
    end if;

    -------------------------------------------------------------------
    -- 2. Procesar cada item
    -------------------------------------------------------------------
    for rec in select * from jsonb_array_elements(p_items)
    loop
        v_stock_result := public.apply_transformation_stock(
            (rec->>'is_origin')::boolean,
            v_origin_stock_id,
            (rec->>'stock_id')::uuid,
            (rec->>'quantity')::numeric,
            (rec->>'location_id')::bigint,
            rec->'lot'
        );

        if (rec->>'is_origin')::boolean = true then
            v_final_stock_id := v_origin_stock_id;
            select lot_id into v_final_lot_id
            from stock where stock_id = v_origin_stock_id;
        else
            v_final_lot_id   := (v_stock_result->>'lot_id')::bigint;
            v_final_stock_id := (v_stock_result->>'stock_id')::uuid;
        end if;

        insert into transformation_items (
            transformation_id,
            product_id,
            product_presentation_id,
            lot_id,
            stock_id,
            is_origin,
            quantity,
            bulk_quantity_equivalence,
            final_cost_per_unit
        )
        values (
            p_transformation_id,
            (rec->>'product_id')::bigint,
            (rec->>'product_presentation_id')::bigint,
            v_final_lot_id,
            v_final_stock_id,
            (rec->>'is_origin')::boolean,
            (rec->>'quantity')::numeric,
            (rec->>'bulk_quantity_equivalence')::numeric,
            (rec->>'final_cost_per_unit')::numeric
        )
        returning transformation_item_id into v_detail_id;

        v_results := v_results || jsonb_build_object(
            'transformation_item_id',  v_detail_id,
            'product_id',              rec->>'product_id',
            'product_presentation_id', rec->>'product_presentation_id',
            'lot_id',                  v_final_lot_id,
            'stock_id',                v_final_stock_id,
            'quantity',                rec->>'quantity',
            'is_origin',               rec->>'is_origin'
        );
    end loop;

    return v_results;
end;
$$;
