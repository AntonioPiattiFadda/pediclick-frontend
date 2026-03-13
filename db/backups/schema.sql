


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."client_type" AS ENUM (
    'REGISTERED',
    'FINAL'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."commission_type" AS ENUM (
    'TOTAL_PERCENTAGE',
    'BY_UNIT',
    'NONE'
);


ALTER TYPE "public"."commission_type" OWNER TO "postgres";


CREATE TYPE "public"."discount_type_enum" AS ENUM (
    'percentage',
    'fixed_amount'
);


ALTER TYPE "public"."discount_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."logic_type" AS ENUM (
    'QUANTITY_DISCOUNT',
    'SPECIAL',
    'LIMITED_OFFER'
);


ALTER TYPE "public"."logic_type" OWNER TO "postgres";


CREATE TYPE "public"."movement_status" AS ENUM (
    'PENDING',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE "public"."movement_status" OWNER TO "postgres";


CREATE TYPE "public"."movement_type" AS ENUM (
    'TRANSFER',
    'SALE',
    'WASTE',
    'INITIAL_LOAD'
);


ALTER TYPE "public"."movement_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."movement_type" IS 'SALE and INITIAL_LOAD are unuser for now.';



CREATE TYPE "public"."order_status" AS ENUM (
    'NEW',
    'PROCESSING',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RETURNED',
    'DELIVERING'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."order_type" AS ENUM (
    'DIRECT_SALE',
    'CREDIT_ORDER',
    'RESERVATION',
    'ONLINE_PICKUP',
    'DELIVERY'
);


ALTER TYPE "public"."order_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_direction" AS ENUM (
    'OUT',
    'IN'
);


ALTER TYPE "public"."payment_direction" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'ON_CREDIT',
    'CRYPTO',
    'OVERPAYMENT',
    'CHECK'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'PENDING',
    'PAID',
    'PARTIALLY_PAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'ORDER',
    'CREDIT_CARD',
    'PROVIDER_PAYMENT',
    'SALARY_PAYMENT',
    'CLIENT_PAYMENT'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."promotion_type_enum" AS ENUM (
    'product',
    'category',
    'store',
    'shipping'
);


ALTER TYPE "public"."promotion_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."sell_type" AS ENUM (
    'MINOR',
    'MAYOR'
);


ALTER TYPE "public"."sell_type" OWNER TO "postgres";


CREATE TYPE "public"."sell_unit" AS ENUM (
    'BY_UNIT',
    'BY_WEIGHT'
);


ALTER TYPE "public"."sell_unit" OWNER TO "postgres";


COMMENT ON TYPE "public"."sell_unit" IS 'For product presentations';



CREATE TYPE "public"."stock_type" AS ENUM (
    'STORE',
    'WASTE',
    'NOT_ASSIGNED',
    'SOLD',
    'TRANSFORMED',
    'STOCKROOM'
);


ALTER TYPE "public"."stock_type" OWNER TO "postgres";


CREATE TYPE "public"."tax_condition_type" AS ENUM (
    'VAT_REGISTERED_RESPONSIBLE',
    'VAT_EXEMPT_SUBJECT',
    'FINAL_CONSUMER',
    'MONOTAX_RESPONSIBLE',
    'UNCATEGORIZED_SUBJECT',
    'FOREIGN_SUPPLIER',
    'FOREIGN_CLIENT',
    'VAT_LIBERATED_LAW_19640',
    'SOCIAL_MONOTAX',
    'VAT_NOT_REACHED',
    'PROMOTED_INDEPENDENT_MONOTAX_WORKER'
);


ALTER TYPE "public"."tax_condition_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'INVOICE',
    'PAYMENT',
    'REFUND'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."transformation_type" AS ENUM (
    'TRANSFORMATION',
    'FRACTION'
);


ALTER TYPE "public"."transformation_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'OWNER',
    'MANAGER',
    'SUPERADMIN',
    'EMPLOYEE'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_existing_stock_id bigint;
begin
  ---------------------------------------------------------------------------
  -- 1️⃣ Buscar stock existente
  ---------------------------------------------------------------------------
  select stock_id
  into v_existing_stock_id
  from stock
  where lot_id = p_lot_id
    and location_id = p_location_id
  for update;

  ---------------------------------------------------------------------------
  -- 2️⃣ Si existe → sumar
  ---------------------------------------------------------------------------
  if found then
    update stock
    set quantity = quantity + p_quantity
    where stock_id = v_existing_stock_id;

  ---------------------------------------------------------------------------
  -- 3️⃣ Si no existe → crear nuevo stock
  ---------------------------------------------------------------------------
  else
    insert into stock (
      product_id,
      lot_id,
      location_id,
      quantity,
      created_at
    )
    values (
      p_product_id,
      p_lot_id,
      p_location_id,
      p_quantity,
      now()
    );
  end if;
end;
$$;


ALTER FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" "uuid", "p_amount" numeric, "p_credit_direction" "text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_available_credit numeric;
  v_new_balance numeric;
begin
  -- 1. Validaciones básicas
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than 0';
  end if;

  if p_credit_direction not in ('POSITIVE', 'NEGATIVE') then
    raise exception 'Invalid credit_direction: %', p_credit_direction;
  end if;

  -- 2. Lockear cliente y obtener crédito disponible
  select available_credit
  into v_available_credit
  from clients
  where client_id = p_client_id
  for update;

  if not found then
    raise exception 'Client not found (id=%)', p_client_id;
  end if;

  -- 3. Validar crédito suficiente si es NEGATIVE
  if p_credit_direction = 'NEGATIVE'
     and v_available_credit < p_amount then
    raise exception
      'Insufficient available credit. Available: %, Required: %',
      v_available_credit,
      p_amount;
  end if;

  -- 4. Aplicar ajuste
  update clients
  set
    current_balance =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(current_balance,0) + p_amount
        else
          coalesce(current_balance,0) - p_amount
      end,
    available_credit =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(available_credit,0) + p_amount
        else
          available_credit - p_amount
      end,
    last_transaction_date = now()
  where client_id = p_client_id
  returning current_balance into v_new_balance;

  -- 5. Retornar nuevo balance
  return v_new_balance;
end;
$$;


ALTER FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" "uuid", "p_amount" numeric, "p_credit_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" "uuid", "p_stock_id" "uuid", "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_origin_lot_id     bigint;
  v_existing_lot_id   bigint;
  v_existing_stock_id uuid;
  v_new_lot_id        bigint;
  v_new_stock_id      uuid;
begin
  select lot_id into v_origin_lot_id
  from stock where stock_id = p_origin_stock_id;

  if v_origin_lot_id is null then
    raise exception 'Origin lot not found for stock_id %', p_origin_stock_id;
  end if;

  -- ORIGEN: restar en base units
  if p_is_origin is true then
    update stock
    set quantity   = quantity - p_quantity,
        updated_at = now()
    where stock_id = p_origin_stock_id;

    return jsonb_build_object(
      'lot_id',           v_origin_lot_id,
      'stock_id',         p_origin_stock_id,
      'quantity_applied', -p_quantity
    );
  end if;

  -- DESTINO: buscar lote existente via lot_traces
  select l.lot_id, s.stock_id
  into v_existing_lot_id, v_existing_stock_id
  from lot_traces t
  join lots  l on l.lot_id = t.lot_to_id
  join stock s on s.lot_id = l.lot_id
  where t.lot_from_id = v_origin_lot_id
    and l.product_id  = (p_lot->>'product_id')::bigint
    and s.location_id = p_location_id
  limit 1;

  -- Reusar lote existente
  if v_existing_stock_id is not null then
    update stock
    set quantity   = quantity + p_quantity,
        updated_at = now()
    where stock_id = v_existing_stock_id;

    return jsonb_build_object(
      'lot_id',           v_existing_lot_id,
      'stock_id',         v_existing_stock_id,
      'quantity_applied', p_quantity,
      'reused_lot',       true
    );
  end if;

  -- Crear lote nuevo
  insert into lots (
    product_id,
    provider_id,
    expiration_date,
    expiration_date_notification,
    initial_stock_quantity,
    final_cost_per_unit,
    created_at
  )
  values (
    (p_lot->>'product_id')::bigint,
    nullif(p_lot->>'provider_id', '')::bigint,
    nullif(p_lot->>'expiration_date', '')::timestamptz,
    coalesce((p_lot->>'expiration_date_notification')::boolean, false),
    p_quantity,
    nullif(p_lot->>'final_cost_per_unit', '')::numeric,
    now()
  )
  returning lot_id into v_new_lot_id;

  insert into stock (
    lot_id,
    quantity,
    stock_type,
    product_id,
    location_id,
    product_presentation_id,
    created_at
  )
  values (
    v_new_lot_id,
    p_quantity,
    'STORE',
    (p_lot->>'product_id')::bigint,
    p_location_id,
    nullif(p_lot->>'product_presentation_id', '')::bigint,
    now()
  )
  returning stock_id into v_new_stock_id;

  perform public.create_lot_trace(v_origin_lot_id, v_new_lot_id);

  return jsonb_build_object(
    'lot_id',           v_new_lot_id,
    'stock_id',         v_new_stock_id,
    'quantity_applied', p_quantity,
    'reused_lot',       false
  );

exception
  when others then
    raise exception 'apply_transformation_stock failed: %', sqlerrm;
end;
$$;


ALTER FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" "uuid", "p_stock_id" "uuid", "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") RETURNS TABLE("order_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id          uuid;
  v_item              jsonb;
  v_order_lot_id      bigint;
  v_stock_id          uuid;
  v_qty_in_base_units numeric;
  v_lot_is_closed     boolean;
begin
  v_order_id := (p_order->>'order_id')::uuid;

  update public.orders o
  set
    client_type   = (p_order->>'client_type')::client_type,
    client_id     = nullif(p_order->>'client_id','')::uuid,
    provider_id   = nullif(p_order->>'provider_id','')::bigint,
    order_type    = (p_order->>'order_type')::order_type,
    order_status  = 'CANCELLED'::order_status,
    subtotal      = (p_order->>'subtotal')::numeric,
    discount      = coalesce((p_order->>'discount')::numeric, 0),
    tax           = coalesce((p_order->>'tax')::numeric, 0),
    total_amount  = (p_order->>'total_amount')::numeric,
    currency      = (p_order->>'currency')::text,
    notes         = concat_ws(' | ', coalesce(o.notes,''), 'Orden cancelada el ' || now()::text),
    delivery_date = nullif(p_order->>'delivery_date','')::timestamptz,
    updated_at    = now()
  where o.order_id = v_order_id;

  if not found then
    raise exception 'No existe la orden con order_id=%', v_order_id;
  end if;

  for v_item in select * from jsonb_array_elements(p_order_items)
  loop
    v_order_lot_id      := (v_item->>'lot_id')::bigint;
    v_stock_id          := (v_item->>'stock_id')::uuid;
    v_qty_in_base_units := coalesce(
      (v_item->>'qty_in_base_units')::numeric,
      (v_item->>'quantity')::numeric
    );

    insert into public.order_items (
      order_id, product_id, lot_id,
      quantity, qty_in_base_units, price,
      subtotal, discount, tax, total, created_at
    )
    values (
      v_order_id,
      (v_item->>'product_id')::bigint,
      v_order_lot_id,
      (v_item->>'quantity')::numeric,
      v_qty_in_base_units,
      (v_item->>'price')::numeric,
      (v_item->>'subtotal')::numeric,
      coalesce((v_item->>'discount')::numeric, 0),
      coalesce((v_item->>'tax')::numeric, 0),
      (v_item->>'total')::numeric,
      now()
    );

    if v_stock_id is not null and v_qty_in_base_units > 0 then

      -- NOTE: The README spec refers to "is_closed" — in the current schema, the equivalent
      -- column is "is_sold_out". There is no separate "is_closed" column on lots.
      -- We skip stock restoration if the lot is already marked as sold out / closed.
      if v_order_lot_id is not null then
        select is_sold_out
        into v_lot_is_closed
        from lots
        where lot_id = v_order_lot_id;
      else
        v_lot_is_closed := false;
      end if;

      if not coalesce(v_lot_is_closed, false) then
        update stock s
        set quantity = s.quantity + v_qty_in_base_units,
            updated_at = now()
        where s.stock_id = v_stock_id;

        if v_order_lot_id is not null then
          perform update_lot_sold_out_status(v_order_lot_id);
        end if;
      end if;
    end if;
  end loop;

  insert into public.notifications (
    created_at, is_read, organization_id,
    title, message, order_id, canceled_by
  )
  values (
    now(), false,
    (p_notification->>'organization_id')::uuid,
    (p_notification->>'title')::text,
    (p_notification->>'message')::text,
    v_order_id,
    nullif(p_notification->>'canceled_by','')::uuid
  );

  return query select v_order_id;
end;
$$;


ALTER FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_load_order_id bigint;
  v_unit jsonb;
  v_lot jsonb;
  v_stocks jsonb;
  v_lot_containers_stock jsonb;
  v_add_stock_result jsonb;

  v_results jsonb := '[]'::jsonb;
begin
  ---------------------------------------------------------------------------
  -- 1️⃣ Insertar LOAD ORDER (header)
  ---------------------------------------------------------------------------

  insert into load_orders (
    organization_id,
    load_order_number,
    provider_id,
    delivery_date,
    receptor_id,
    receptor_other,
    transporter_data,
    invoice_number,
    observations,
    total_download_cost,
    status,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    nullif(p_load_order->>'load_order_number','')::numeric,
    nullif(p_load_order->>'provider_id','')::bigint,
    nullif(p_load_order->>'delivery_date','')::date,
    nullif(p_load_order->>'receptor_id','')::uuid,
    p_load_order->>'receptor_other',
    p_load_order->'transporter_data',
    nullif(p_load_order->>'invoice_number','')::numeric,
    p_load_order->>'observations',
    coalesce((p_load_order->>'total_download_cost')::numeric, 0),
    coalesce((p_load_order->>'status')::text, 'PENDING'),
    now(),
    now()
  )
  returning load_order_id
  into v_load_order_id;

  ---------------------------------------------------------------------------
  -- 2️⃣ Iterar UNITS (1 unidad = 1 add_stock)
  ---------------------------------------------------------------------------

  for v_unit in
    select * from jsonb_array_elements(p_units)
  loop
    -------------------------------------------------------------------------
    -- 2.1 Extraer componentes
    -------------------------------------------------------------------------

    v_lot := v_unit->'lot';
    v_stocks := v_unit->'stocks';
    v_lot_containers_stock := v_unit->'lot_containers_stock';

    -------------------------------------------------------------------------
    -- 2.2 Inyectar load_order_id en el LOT
    -------------------------------------------------------------------------

    v_lot := jsonb_set(
      v_lot,
      '{load_order_id}',
      to_jsonb(v_load_order_id),
      true
    );

    -------------------------------------------------------------------------
    -- 2.3 Ejecutar add_stock
    -------------------------------------------------------------------------

    v_add_stock_result := public.add_stock(
      v_lot,
      v_stocks,
      v_lot_containers_stock,
      p_organization_id
    );

    -------------------------------------------------------------------------
    -- 2.4 Acumular resultado
    -------------------------------------------------------------------------

    v_results := v_results || jsonb_build_object(
      'lot_id', v_add_stock_result->>'lot_id'
    );
  end loop;

  ---------------------------------------------------------------------------
  -- 3️⃣ Retorno final
  ---------------------------------------------------------------------------

  return jsonb_build_object(
    'load_order_id', v_load_order_id,
    'lots', v_results
  );

exception
  when others then
    raise;
end;
$$;


ALTER FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into lot_traces (lot_from_id, lot_to_id, created_at)
  values (p_lot_from_id, p_lot_to_id, now());
end;
$$;


ALTER FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_org_id uuid;
begin
  --------------------------------------------------
  -- 1️⃣ Crear organización (con o sin nombre)
  --------------------------------------------------
  insert into organizations (organization_name)
  values (
    coalesce(p_organization_name, '')
  )
  returning organization_id
  into v_org_id;

  --------------------------------------------------
  -- 2️⃣ Crear usuario OWNER asociado
  --------------------------------------------------
  insert into users (
    id,
    email,
    role,
    organization_id
  )
  values (
    p_user_id,
    p_email,
    'OWNER',
    v_org_id
  );

  --------------------------------------------------
  -- 3️⃣ Retornar organization_id
  --------------------------------------------------
  return v_org_id;
end;
$$;


ALTER FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "order_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" bigint,
    "client_id" "uuid",
    "provider_id" bigint,
    "order_number" bigint NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" character varying(3) DEFAULT 'ARS'::character varying,
    "notes" "text",
    "delivery_date" timestamp without time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "client_type" "public"."client_type",
    "payment_status" "public"."payment_status",
    "order_status" "public"."order_status" DEFAULT 'NEW'::"public"."order_status",
    "order_type" "public"."order_type",
    "organization_id" "uuid",
    "terminal_session_id" "uuid"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" "uuid") RETURNS "public"."orders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order       orders;
  v_order_number bigint;
begin
  -- Generar número correlativo para la tienda
  v_order_number := generate_order_number(p_location_id);

  -- Insertar orden mínima
  insert into orders (
    organization_id,
    location_id,
    client_id,
    order_number,
    created_at
  )
  values (
    p_organization_id,
    p_location_id,
    p_client_id,
    v_order_number,
    now()
  )
  returning * into v_order;

  return v_order;
end;
$$;


ALTER FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_movement_id uuid;
begin
  -- 1. Reducir stock en base units
  perform public.update_stock_waste(p_stock_id, p_qty_in_base_units);

  -- 2. Registrar movimiento con ambas cantidades y la presentación
  v_stock_movement_id := public.insert_stock_movement(
    p_lot_id,
    p_stock_id,
    p_movement_type,
    p_quantity,
    p_qty_in_base_units,
    p_product_presentation_id,
    p_from_location_id,
    p_to_location_id,
    p_should_notify_owner,
    p_created_by
  );

  return jsonb_build_object(
    'success', true,
    'stock_movement_id', v_stock_movement_id
  );
end;
$$;


ALTER FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transformation_id   bigint;
  v_items               jsonb;
  v_transformation_type transformation_type;
  v_origin_product_id   bigint;
  v_dest_product_ids    bigint[];
begin
  select (item->>'product_id')::bigint
  into v_origin_product_id
  from jsonb_array_elements(p_transformation_items) item
  where (item->>'is_origin')::boolean = true
  limit 1;

  select array_agg(distinct (item->>'product_id')::bigint)
  into v_dest_product_ids
  from jsonb_array_elements(p_transformation_items) item
  where (item->>'is_origin')::boolean = false;

  if v_dest_product_ids = array[v_origin_product_id] then
    v_transformation_type := 'FRACTION';
  else
    v_transformation_type := 'TRANSFORMATION';
  end if;

  insert into transformations (
    transformation_cost, notes, created_at,
    organization_id, created_by, transformation_type
  )
  values (
    (p_transformation_data->>'transformation_cost')::numeric,
    p_transformation_data->>'notes',
    coalesce((p_transformation_data->>'created_at')::timestamptz, now()),
    p_organization_id,
    (p_transformation_data->>'created_by')::uuid,
    v_transformation_type
  )
  returning transformation_id into v_transformation_id;

  v_items := public.process_transformation_items(v_transformation_id, p_transformation_items);

  return jsonb_build_object(
    'transformation_id',   v_transformation_id,
    'transformation_type', v_transformation_type,
    'items',               v_items
  );
end;
$$;


ALTER FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select u.organization_id
  from public.users u
  where u.id = auth.uid();
$$;


ALTER FUNCTION "public"."current_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" "uuid", "p_stock_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_qty_in_base_units  numeric;
  v_over_sell_quantity numeric;
  v_total_reserved     numeric;
begin
  ------------------------------------------------------------------
  -- Obtener cantidades del order_item
  -- FIX: usar qty_in_base_units en lugar de quantity para calcular
  --      v_total_reserved (consistencia de unidades)
  ------------------------------------------------------------------
  select qty_in_base_units, over_sell_quantity
  into v_qty_in_base_units, v_over_sell_quantity
  from order_items
  where order_item_id = p_order_item_id;

  if not found then
    raise exception 'Order item % no encontrado', p_order_item_id;
  end if;

  v_total_reserved := coalesce(v_qty_in_base_units, 0) + coalesce(v_over_sell_quantity, 0);

  ------------------------------------------------------------------
  -- Actualizar status a CANCELLED
  ------------------------------------------------------------------
  update order_items
  set status = 'CANCELLED',
      updated_at = now()
  where order_item_id = p_order_item_id;

  ------------------------------------------------------------------
  -- Descontar reserved_for_selling_quantity
  ------------------------------------------------------------------
  update stock
  set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
      updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" "uuid", "p_stock_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deliver_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb;
begin
  ------------------------------------------------------------------
  -- Obtener todos los order_items PENDING
  ------------------------------------------------------------------
  select jsonb_agg(
    jsonb_build_object(
      'order_item_id',    oi.order_item_id,
      'stock_id',         oi.stock_id,
      -- FIX: incluir qty_in_base_units explícitamente para que
      -- process_delivered_items_stock no use el fallback a quantity
      'qty_in_base_units', oi.qty_in_base_units,
      'quantity',         oi.quantity,
      'over_sell_quantity', oi.over_sell_quantity
    )
  )
  into v_items
  from order_items oi
  where oi.order_id = p_order_id
    and oi.status = 'PENDING';

  ------------------------------------------------------------------
  -- Actualizar order_items a COMPLETED
  ------------------------------------------------------------------
  update order_items
  set status = 'COMPLETED',
      updated_at = now()
  where order_id = p_order_id
    and status = 'PENDING';

  ------------------------------------------------------------------
  -- Actualizar orden a DELIVERED
  ------------------------------------------------------------------
  update orders
  set order_status = 'DELIVERED',
      updated_at = now()
  where order_id = p_order_id;

  ------------------------------------------------------------------
  -- FIX: Procesar stock siempre (aunque v_items sea null)
  -- Si todos los items estaban en otro status, v_items = null →
  -- antes se salteaba el bloque y la orden quedaba DELIVERED sin
  -- procesar stock. Ahora se llama igualmente con array vacío.
  ------------------------------------------------------------------
  perform process_delivered_items_stock(coalesce(v_items, '[]'::jsonb));
end;
$$;


ALTER FUNCTION "public"."deliver_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"("p_location_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_next_number bigint;
begin
  insert into store_order_sequences (location_id, last_number)
  values (p_location_id, 0)
  on conflict (location_id) do nothing;

  update store_order_sequences
  set last_number = last_number + 1
  where location_id = p_location_id
  returning last_number into v_next_number;

  return v_next_number;
end;
$$;


ALTER FUNCTION "public"."generate_order_number"("p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_integration_credentials"("p_organization_id" "uuid", "p_provider" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_key    text;
    v_role   user_role_enum;
    v_result jsonb;
BEGIN
    SELECT role INTO v_role
    FROM users WHERE id = auth.uid();

    IF v_role NOT IN ('OWNER', 'MANAGER') THEN
        RAISE EXCEPTION 'Acceso denegado: usar get_integration_credentials_safe';
    END IF;

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'integration_credentials_key';

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;

    SELECT extensions.pgp_sym_decrypt(credentials_encrypted, v_key)::jsonb
    INTO v_result
    FROM integration_credentials
    WHERE organization_id = p_organization_id
      AND provider = p_provider
      AND is_active = true;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_integration_credentials"("p_organization_id" "uuid", "p_provider" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_integration_credentials_safe"("p_organization_id" "uuid", "p_provider" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_key            text;
    v_full           jsonb;
    v_safe           jsonb := '{}'::jsonb;
    v_sensitive_keys text[];
    v_k              text;
    v_v              text;
BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'integration_credentials_key';

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;

    SELECT extensions.pgp_sym_decrypt(credentials_encrypted, v_key)::jsonb
    INTO v_full
    FROM integration_credentials
    WHERE organization_id = p_organization_id
      AND provider = p_provider
      AND is_active = true;

    IF v_full IS NULL THEN
        RETURN NULL;
    END IF;

    CASE p_provider
        WHEN 'MERCADOPAGO' THEN
            v_sensitive_keys := ARRAY['access_token'];
        WHEN 'AFIP' THEN
            v_sensitive_keys := ARRAY['private_key', 'cert'];
        ELSE
            v_sensitive_keys := ARRAY[]::text[];
    END CASE;

    FOR v_k, v_v IN SELECT * FROM jsonb_each_text(v_full)
    LOOP
        IF NOT (v_k = ANY(v_sensitive_keys)) THEN
            v_safe := v_safe || jsonb_build_object(v_k, v_v);
        END IF;
    END LOOP;

    RETURN v_safe;
END;
$$;


ALTER FUNCTION "public"."get_integration_credentials_safe"("p_organization_id" "uuid", "p_provider" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_lot_costs"("p_product_presentation_id" bigint, OUT "final_cost_per_unit" numeric, OUT "final_cost_per_bulk" numeric) RETURNS "record"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_bulk_quantity_equivalence numeric;
BEGIN
  -- Obtener bulk_quantity_equivalence de la presentación
  SELECT pp.bulk_quantity_equivalence
  INTO v_bulk_quantity_equivalence
  FROM product_presentations pp
  WHERE pp.product_presentation_id = p_product_presentation_id
  LIMIT 1;

  -- Obtener el último lote del producto
  SELECT
    COALESCE(l.final_cost_per_unit, 0),
    COALESCE(l.final_cost_per_unit, 0) * COALESCE(v_bulk_quantity_equivalence, 1)
    -- ✅ final_cost_per_bulk calculado on the fly
  INTO
    final_cost_per_unit,
    final_cost_per_bulk
  FROM lots l
  WHERE l.product_id = (
    SELECT product_id
    FROM product_presentations
    WHERE product_presentation_id = p_product_presentation_id
    LIMIT 1
  )
  ORDER BY l.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    final_cost_per_unit := 0;
    final_cost_per_bulk := 0;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_last_lot_costs"("p_product_presentation_id" bigint, OUT "final_cost_per_unit" numeric, OUT "final_cost_per_bulk" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_location_id" bigint) RETURNS TABLE("stock_id" "uuid", "lot_id" bigint, "over_sell_quantity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_sales"("p_lot_id" bigint) RETURNS TABLE("order_id" bigint, "order_number" bigint, "order_date" timestamp with time zone, "order_status" "text", "client_id" bigint, "order_item_id" bigint, "lot_id" bigint, "product_id" bigint, "product_name" "text", "quantity" numeric, "price" numeric, "total" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.order_id,
        o.order_number,
        o.created_at       AS order_date,
        o.order_status::text     AS order_status,
        o.client_id,
        oi.order_item_id,
        oi.lot_id::bigint,
        l.product_id,
        p.product_name,
        oi.quantity,
        oi.price,
        oi.total
    FROM order_items oi
    JOIN orders      o  ON o.order_id   = oi.order_id
    JOIN lots        l  ON l.lot_id     = oi.lot_id
    JOIN products    p  ON p.product_id = l.product_id
    WHERE oi.lot_id = p_lot_id
      AND oi.is_deleted = false
    ORDER BY o.created_at;
END;
$$;


ALTER FUNCTION "public"."get_lot_sales"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_transformations"("p_lot_id" bigint) RETURNS TABLE("transformation_id" bigint, "transformation_date" timestamp with time zone, "transformation_cost" numeric, "notes" "text", "transformation_item_id" bigint, "is_origin" boolean, "ti_lot_id" bigint, "product_id" bigint, "product_name" "text", "quantity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.transformation_id,
    t.created_at,
    t.transformation_cost,
    t.notes,
    ti.transformation_item_id,
    ti.is_origin,
    ti.lot_id AS ti_lot_id,
    ti.product_id,
    p.product_name,
    ti.quantity
  FROM transformation_items ti
  JOIN transformations t ON t.transformation_id = ti.transformation_id
  JOIN products p ON p.product_id = ti.product_id
  WHERE ti.transformation_id IN (
    SELECT ti2.transformation_id
    FROM transformation_items ti2
    WHERE ti2.lot_id = p_lot_id
  )
  ORDER BY t.created_at;
END;
$$;


ALTER FUNCTION "public"."get_lot_transformations"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_wastes"("p_lot_id" bigint) RETURNS TABLE("stock_movement_id" bigint, "waste_date" timestamp with time zone, "lot_id" bigint, "stock_id" bigint, "quantity" numeric, "from_location_id" bigint, "created_by" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.stock_movement_id,
        sm.created_at    AS waste_date,
        sm.lot_id,
        sm.stock_id,
        sm.quantity,
        sm.from_location_id,
        sm.created_by
    FROM stock_movements sm
    WHERE sm.lot_id       = p_lot_id
      AND sm.movement_type = 'WASTE'
    ORDER BY sm.created_at;
END;
$$;


ALTER FUNCTION "public"."get_lot_wastes"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mp_credentials_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_key     text;
    v_account jsonb;
    v_pos     record;
BEGIN
    IF (SELECT role FROM users WHERE id = auth.uid()) NOT IN ('OWNER', 'MANAGER') THEN
        RAISE EXCEPTION 'Acceso denegado: se requiere rol OWNER o MANAGER';
    END IF;

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'integration_credentials_key';

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;

    SELECT extensions.pgp_sym_decrypt(credentials_encrypted, v_key)::jsonb
    INTO v_account
    FROM integration_credentials
    WHERE organization_id = p_organization_id
      AND provider = 'MERCADOPAGO'
      AND is_active = true;

    IF v_account IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        mp_store_id, mp_store_external_id,
        mp_pos_id, mp_pos_external_id,
        mp_qr_uuid, mp_qr_image_url,
        mp_point_device_id
    INTO v_pos
    FROM mp_pos_config
    WHERE terminal_id = p_terminal_id
      AND is_active = true
      AND deleted_at IS NULL;

    IF v_pos IS NULL THEN
        RETURN v_account;
    END IF;

    RETURN v_account || jsonb_build_object(
        'store_id',          v_pos.mp_store_id,
        'store_external_id', v_pos.mp_store_external_id,
        'pos_id',            v_pos.mp_pos_id,
        'pos_external_id',   v_pos.mp_pos_external_id,
        'qr_uuid',           v_pos.mp_qr_uuid,
        'qr_image_url',      v_pos.mp_qr_image_url,
        'point_device_id',   v_pos.mp_point_device_id
    );
END;
$$;


ALTER FUNCTION "public"."get_mp_credentials_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mp_pos_config_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_pos record;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid()) AND organization_id = p_organization_id
    ) THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

    SELECT
        mp.mp_store_id, mp.mp_store_external_id,
        mp.mp_pos_id, mp.mp_pos_external_id,
        mp.mp_qr_uuid, mp.mp_qr_image_url,
        mp.mp_point_device_id,
        mp.location_id,
        l.name AS location_name
    INTO v_pos
    FROM mp_pos_config mp
    JOIN locations l ON l.location_id = mp.location_id
    WHERE mp.terminal_id = p_terminal_id
      AND mp.organization_id = p_organization_id
      AND mp.is_active = true
      AND mp.deleted_at IS NULL;

    IF v_pos IS NULL THEN RETURN NULL; END IF;

    RETURN jsonb_build_object(
        'store_id',          v_pos.mp_store_id,
        'store_external_id', v_pos.mp_store_external_id,
        'pos_id',            v_pos.mp_pos_id,
        'pos_external_id',   v_pos.mp_pos_external_id,
        'qr_uuid',           v_pos.mp_qr_uuid,
        'qr_image_url',      v_pos.mp_qr_image_url,
        'point_device_id',   v_pos.mp_point_device_id,
        'location_id',       v_pos.location_id,
        'location_name',     v_pos.location_name
    );
END;
$$;


ALTER FUNCTION "public"."get_mp_pos_config_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_product_short_code"("p_organization_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_next bigint;
begin
  select min(s.gap)
  into v_next
  from (
    select generate_series(1, (select coalesce(max(short_code), 0) + 1 from products where organization_id = p_organization_id)) as gap
    except
    select short_code from products where organization_id = p_organization_id and short_code is not null
  ) s;

  return coalesce(v_next, 1);
end;
$$;


ALTER FUNCTION "public"."get_next_product_short_code"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_location_id" bigint) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_result jsonb;
begin
  -- Generar JSON con todos los productos activos que usan ese short_code
  select jsonb_agg(
    jsonb_build_object(
      'product_id', p.product_id,
      'product_name', p.product_name,
      'is_sold_out', not exists (
        select 1
        from lots l
        where l.product_id = p.product_id
          and l.is_sold_out = false
      )
    )
  )
  into v_result
  from products p
  where p.short_code = p_short_code
    and p.organization_id = p_organization_id
    and p.deleted_at is null;  -- ✅ solo productos activos

  -- Si no hay productos, devolver array vacío
  if v_result is null then
    v_result := '[]'::jsonb;
  end if;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") RETURNS TABLE("name" "text", "sales" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.product_name as name,
    sum(oi.quantity) as sales
  from order_items oi
  join orders o
    on o.order_id = oi.order_id
  join products p
    on p.product_id = oi.product_id
  where
    o.organization_id = p_organization_id
    and oi.created_at >= now() - interval '30 days'
    and oi.status = 'COMPLETED'
    and oi.is_deleted = false
  group by
    p.product_id,
    p.product_name
  order by sales desc
  limit 10;
$$;


ALTER FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_movement_id uuid;
begin
  insert into stock_movements (
    lot_id,
    stock_id,
    movement_type,
    quantity,
    qty_in_base_units,
    product_presentation_id,
    from_location_id,
    to_location_id,
    should_notify_owner,
    created_by,
    created_at
  )
  values (
    p_lot_id,
    p_stock_id,
    p_movement_type,
    p_quantity,
    p_qty_in_base_units,
    p_product_presentation_id,
    p_from_location_id,
    p_to_location_id,
    coalesce(p_should_notify_owner, false),
    p_created_by,
    now()
  )
  returning stock_movement_id into v_stock_movement_id;

  return v_stock_movement_id;
end;
$$;


ALTER FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_item jsonb;
  v_order_item_id uuid;
  v_stock_id      uuid;
  v_qty_in_base_units numeric;
  v_over_sell_quantity numeric;
  v_total_reserved numeric;
  v_current_quantity numeric;
  v_remaining numeric;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_item_id     := (v_item->>'order_item_id')::uuid;
    v_stock_id          := (v_item->>'stock_id')::uuid;
    -- usar qty_in_base_units para descontar; fallback a quantity si no existe
    v_qty_in_base_units := coalesce(
      (v_item->>'qty_in_base_units')::numeric,
      (v_item->>'quantity')::numeric
    );
    v_over_sell_quantity := coalesce((v_item->>'over_sell_quantity')::numeric, 0);
    v_total_reserved     := v_qty_in_base_units + v_over_sell_quantity;

    ------------------------------------------------------------------
    -- FIX: Obtener quantity actual del stock con FOR UPDATE
    --      para prevenir desincronización en retry parcial
    ------------------------------------------------------------------
    select quantity into v_current_quantity
    from stock
    where stock_id = v_stock_id
    for update;

    ------------------------------------------------------------------
    -- Descontar reserved_for_selling_quantity
    ------------------------------------------------------------------
    update stock
    set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
        updated_at = now()
    where stock_id = v_stock_id;

    ------------------------------------------------------------------
    -- Descontar de quantity usando qty_in_base_units
    ------------------------------------------------------------------
    if v_current_quantity >= v_total_reserved then
      update stock
      set quantity = quantity - v_total_reserved,
          updated_at = now()
      where stock_id = v_stock_id;
    else
      v_remaining := v_total_reserved - v_current_quantity;

      update stock
      set quantity = 0,
          over_sell_quantity = coalesce(over_sell_quantity, 0) + v_remaining,
          updated_at = now()
      where stock_id = v_stock_id;
    end if;

  end loop;
end;
$$;


ALTER FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  rec               jsonb;
  v_origin_stock_id uuid;
  v_stock_result    jsonb;
  v_final_lot_id    bigint;
  v_final_stock_id  uuid;
  v_detail_id       bigint;
  v_results         jsonb := '[]'::jsonb;
  v_origin_quantity numeric;
  v_dest_total      numeric;
begin
  select (item->>'stock_id')::uuid
  into v_origin_stock_id
  from jsonb_array_elements(p_items) item
  where (item->>'is_origin')::boolean = true
  limit 1;

  if v_origin_stock_id is null then
    raise exception 'No origin stock found in transformation items';
  end if;

  -- Validar contra stock en base units
  select quantity into v_origin_quantity
  from stock where stock_id = v_origin_stock_id;

  select coalesce(sum((item->>'quantity_in_base_units')::numeric), 0)
  into v_dest_total
  from jsonb_array_elements(p_items) item
  where (item->>'is_origin')::boolean = false;

  if v_dest_total > v_origin_quantity then
    raise exception
      'Suma de cantidades destino (%) supera la cantidad origen (%) en stock_id=%',
      v_dest_total, v_origin_quantity, v_origin_stock_id;
  end if;

  for rec in select * from jsonb_array_elements(p_items)
  loop
    v_stock_result := public.apply_transformation_stock(
      (rec->>'is_origin')::boolean,
      v_origin_stock_id,
      (rec->>'stock_id')::uuid,
      -- origen resta en base units, destino suma en base units
      case
        when (rec->>'is_origin')::boolean = true
        then (rec->>'quantity_in_base_units')::numeric
        else (rec->>'quantity_in_base_units')::numeric
      end,
      (rec->>'location_id')::bigint,
      rec->'lot'
    );

    if (rec->>'is_origin')::boolean = true then
      v_final_stock_id := v_origin_stock_id;
      select lot_id into v_final_lot_id from stock where stock_id = v_origin_stock_id;
    else
      v_final_lot_id   := (v_stock_result->>'lot_id')::bigint;
      v_final_stock_id := (v_stock_result->>'stock_id')::uuid;
    end if;

    insert into transformation_items (
      transformation_id, product_id, product_presentation_id,
      lot_id, stock_id, is_origin, quantity, qty_in_base_units,
      bulk_quantity_equivalence, final_cost_per_unit, location_id
    )
    values (
      p_transformation_id,
      (rec->>'product_id')::bigint,
      (rec->>'product_presentation_id')::bigint,
      v_final_lot_id,
      v_final_stock_id,
      (rec->>'is_origin')::boolean,
      (rec->>'quantity')::numeric,
      (rec->>'quantity_in_base_units')::numeric,
      (rec->>'bulk_quantity_equivalence')::numeric,
      (rec->>'final_cost_per_unit')::numeric,
      (rec->>'location_id')::bigint
    )
    returning transformation_item_id into v_detail_id;

    v_results := v_results || jsonb_build_object(
      'transformation_item_id',  v_detail_id,
      'product_id',              rec->>'product_id',
      'product_presentation_id', rec->>'product_presentation_id',
      'lot_id',                  v_final_lot_id,
      'stock_id',                v_final_stock_id,
      'quantity',                rec->>'quantity',
      'qty_in_base_units',       rec->>'quantity_in_base_units',
      'is_origin',               rec->>'is_origin'
    );
  end loop;

  return v_results;
end;
$$;


ALTER FUNCTION "public"."process_transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_client_payments"("p_client_id" "uuid", "p_payments" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_payment     jsonb;
  v_new_balance numeric;
begin
  -- Validación básica
  if p_client_id is null then
    raise exception 'p_client_id cannot be null';
  end if;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop
    ------------------------------------------------------------------
    -- 1. Registrar el pago
    ------------------------------------------------------------------
    insert into payments(
      client_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type,
      terminal_session_id
    )
    values (
      p_client_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type,
      (v_payment->>'terminal_session_id')::uuid

    );

    ------------------------------------------------------------------
    -- ON_CREDIT → aumenta deuda
    ------------------------------------------------------------------
    if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'NEGATIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Consumo a crédito',
        'PAYMENT',
        now(),
        'ON_CREDIT',
        'PENDING',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- OVERPAYMENT → saldo a favor
    ------------------------------------------------------------------
    elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'POSITIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Saldo a favor',
        'PAYMENT',
        now(),
        'OVERPAYMENT',
        'PAID',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- Pagos normales (CASH / CARD / etc.)
    ------------------------------------------------------------------
    else

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      select
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Pago',
        'PAYMENT',
        now(),
        (v_payment->>'payment_method')::payment_method,
        'PAID',
        current_balance,
        now()
      from clients
      where client_id = p_client_id;

    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."register_client_payments"("p_client_id" "uuid", "p_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") RETURNS TABLE("order_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id uuid;
begin
  -- 1) HEADER
  v_order_id := public.register_order_header(p_order);

  -- 2) ITEMS (maneja stock)
  perform public.register_order_items(v_order_id, p_order_items);

  -- 3) PAYMENTS (maneja client_transactions)
  perform public.register_order_payments(v_order_id, p_order_payments);

  -- 4) RETURN
  return query select v_order_id;
end;
$$;


ALTER FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_header"("p_order" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id    uuid;
  v_client_id   uuid;
  v_location_id bigint;
begin
  v_order_id    := (p_order->>'order_id')::uuid;
  v_location_id := (p_order->>'location_id')::bigint;

  update orders
  set
    organization_id = nullif(p_order->>'organization_id','')::uuid,
    location_id       = v_location_id,
    client_type       = (p_order->>'client_type')::client_type,
    client_id         = nullif(p_order->>'client_id','')::uuid,
    provider_id       = nullif(p_order->>'provider_id','')::bigint,
    order_number      = (p_order->>'order_number')::bigint,
    order_type        = (p_order->>'order_type')::order_type,
    order_status      = (p_order->>'order_status')::order_status,
    payment_status    = (p_order->>'payment_status')::payment_status,
    subtotal          = (p_order->>'subtotal')::numeric,
    discount          = coalesce((p_order->>'discount')::numeric,0),
    tax               = coalesce((p_order->>'tax')::numeric,0),
    total_amount      = (p_order->>'total_amount')::numeric,
    currency          = p_order->>'currency',
    notes             = p_order->>'notes',
    delivery_date     = nullif(p_order->>'delivery_date','')::timestamptz,
    updated_at        = now()
  where order_id = v_order_id
  returning client_id into v_client_id;

  if not found then
    raise exception 'No existe la orden con id=%', v_order_id;
  end if;

  return v_order_id;
end;
$$;


ALTER FUNCTION "public"."register_order_header"("p_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_items"("p_order_id" "uuid", "p_items" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_item               jsonb;
  v_quantity           numeric;
  v_qty_in_base_units  numeric;
  v_over_sell_quantity numeric;
  v_location_id        bigint;
  v_new_qty            numeric;
  v_current_qty        numeric;
  v_status             movement_status;
  v_lot_id             bigint;
  v_stock_id           uuid;
  v_order_item_id      uuid;
  v_order_type         order_type;
begin
  select o.location_id, o.order_type
  into v_location_id, v_order_type
  from orders o
  where o.order_id = p_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity           := coalesce((v_item->>'quantity')::numeric, 0);
    v_qty_in_base_units  := coalesce((v_item->>'qty_in_base_units')::numeric, v_quantity);
    v_over_sell_quantity := coalesce((v_item->>'over_sell_quantity')::numeric, 0);
    v_status             := (v_item->>'status')::movement_status;
    v_lot_id             := (v_item->>'lot_id')::bigint;
    v_stock_id           := (v_item->>'stock_id')::uuid;

    insert into order_items (
      order_id,
      product_id,
      product_presentation_id,
      stock_id,
      lot_id,
      quantity,
      qty_in_base_units,
      over_sell_quantity,
      price,
      subtotal,
      discount,
      tax,
      total,
      logic_type,
      status,
      location_id,
      created_at
    )
    values (
      p_order_id,
      (v_item->>'product_id')::bigint,
      (v_item->>'product_presentation_id')::bigint,
      v_stock_id,
      v_lot_id,
      v_quantity,
      v_qty_in_base_units,
      v_over_sell_quantity,
      (v_item->>'price')::numeric,
      (v_item->>'subtotal')::numeric,
      coalesce((v_item->>'discount')::numeric, 0),
      coalesce((v_item->>'tax')::numeric, 0),
      (v_item->>'total')::numeric,
      (v_item->>'logic_type')::logic_type,
      v_status,
      v_location_id,
      now()
    )
    returning order_item_id into v_order_item_id;

    if v_status = 'CANCELLED' then
      continue;
    end if;

    if v_order_type = 'DELIVERY' then
      perform reserve_stock_for_delivery(
        v_order_item_id,
        (v_item->>'product_id')::bigint,
        v_location_id,
        v_stock_id,
        v_qty_in_base_units,
        v_over_sell_quantity
      );
      continue;
    end if;

    if v_stock_id is null then
      if v_over_sell_quantity > 0 then
        select (r->>'lot_id')::bigint, (r->>'stock_id')::uuid
        into v_lot_id, v_stock_id
        from resolve_oversell_stock(
          (v_item->>'product_id')::bigint,
          v_location_id,
          v_over_sell_quantity
        ) r;

        update order_items set lot_id = v_lot_id
        where order_item_id = v_order_item_id;
      end if;
      continue;
    end if;

    if v_qty_in_base_units > 0 then
      -- FIX: SELECT FOR UPDATE before UPDATE to prevent race condition
      select quantity
      into v_current_qty
      from stock s
      where s.stock_id = v_stock_id
      for update;

      if v_current_qty < v_qty_in_base_units then
        raise exception 'Stock insuficiente en stock_id=%. Disponible: %, Requerido: %',
          v_stock_id, v_current_qty, v_qty_in_base_units;
      end if;

      update stock s
      set quantity = s.quantity - v_qty_in_base_units,
          updated_at = now()
      where s.stock_id = v_stock_id
      returning s.quantity into v_new_qty;

      -- Defensive check after update
      if v_new_qty < 0 then
        raise exception 'Stock insuficiente en stock_id=%', v_stock_id;
      end if;
    end if;

    if v_over_sell_quantity > 0 then
      update stock s
      set over_sell_quantity = coalesce(s.over_sell_quantity, 0) + v_over_sell_quantity,
          updated_at = now()
      where s.stock_id = v_stock_id;
    end if;

    if v_lot_id is not null then
      perform update_lot_sold_out_status(v_lot_id);
    end if;

  end loop;
end;
$$;


ALTER FUNCTION "public"."register_order_items"("p_order_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_payments"("p_order_id" "uuid", "p_payments" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

declare
  v_payment             jsonb;
  v_client_id           uuid;
  v_terminal_session_id uuid;
  v_new_balance         numeric;
begin
  select client_id, terminal_session_id
  into v_client_id, v_terminal_session_id
  from orders
  where order_id = p_order_id;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop

    insert into payments(
      order_id,
      terminal_session_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type
    )
    values (
      p_order_id,
      v_terminal_session_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type
    );
    if v_client_id is not null then

      ------------------------------------------------------------------
      -- ON_CREDIT → aumenta deuda
      ------------------------------------------------------------------
     if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'NEGATIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Consumo a crédito - orden #', p_order_id),
    'PAYMENT',
    now(),
    'ON_CREDIT',
    'PENDING',
    v_new_balance,
    now()
  );

      ------------------------------------------------------------------
      -- OVERPAYMENT → reduce deuda / saldo a favor
      ------------------------------------------------------------------
     elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'POSITIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Saldo a favor - orden #', p_order_id),
    'PAYMENT',
    now(),
    'OVERPAYMENT',
    'PAID',
    v_new_balance,
    now()
  );


      ------------------------------------------------------------------
      -- Pagos normales (CASH / CARD / etc.)
      ------------------------------------------------------------------
      else

        insert into client_transactions(
          client_id,
          order_id,
          amount,
          description,
          transaction_type,
          transaction_date,
          payment_method,
          payment_status,
          balance_after_transaction,
          created_at
        )
        select
          v_client_id,
          p_order_id,
          abs((v_payment->>'amount')::numeric),
          concat('Pago de orden #', p_order_id),
          'PAYMENT',
          now(),
          (v_payment->>'payment_method')::payment_method,
          'PAID',
          current_balance,
          now()
        from clients
        where client_id = v_client_id;

      end if;
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."register_order_payments"("p_order_id" "uuid", "p_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" "uuid", "p_product_id" bigint, "p_location_id" bigint, "p_stock_id" "uuid", "p_qty_in_base_units" numeric, "p_over_sell_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_id uuid;
  v_lot_id   bigint;
  v_total_to_reserve numeric;
  v_available_qty    numeric;
begin
  ------------------------------------------------------------------
  -- Obtener o crear stock (sin product_presentation_id)
  ------------------------------------------------------------------
  if p_stock_id is null then
    v_stock_id := get_or_create_stock_with_location_pi_and_pi(
      p_product_id,
      p_location_id
    );
  else
    v_stock_id := p_stock_id;
  end if;

  ------------------------------------------------------------------
  -- Calcular total a reservar en unidad base
  ------------------------------------------------------------------
  v_total_to_reserve := p_qty_in_base_units + p_over_sell_quantity;

  ------------------------------------------------------------------
  -- FIX: Validar que el stock disponible >= total a reservar
  --      (solo para la parte normal, no el oversell)
  -- FOR UPDATE lock previene TOCTOU: dos reservas concurrentes
  -- leyendo el mismo disponible y ambas pasando la validación
  ------------------------------------------------------------------
  select coalesce(quantity, 0) - coalesce(reserved_for_selling_quantity, 0)
  into v_available_qty
  from stock
  where stock_id = v_stock_id
  FOR UPDATE;  -- lock row to prevent TOCTOU race condition

  if v_available_qty is not null and p_qty_in_base_units > 0 and v_available_qty < p_qty_in_base_units then
    raise exception
      'Stock insuficiente para reservar en stock_id=%. Disponible: %, Requerido: %',
      v_stock_id, v_available_qty, p_qty_in_base_units;
  end if;

  ------------------------------------------------------------------
  -- Actualizar reserved_for_selling_quantity
  ------------------------------------------------------------------
  update stock s
  set reserved_for_selling_quantity = coalesce(s.reserved_for_selling_quantity, 0) + v_total_to_reserve,
      updated_at = now()
  where s.stock_id = v_stock_id
  returning s.lot_id into v_lot_id;

  ------------------------------------------------------------------
  -- Actualizar order_item con stock_id y lot_id
  ------------------------------------------------------------------
  update order_items
  set stock_id = v_stock_id,
      lot_id   = v_lot_id
  where order_item_id = p_order_item_id;
end;
$$;


ALTER FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" "uuid", "p_product_id" bigint, "p_location_id" bigint, "p_stock_id" "uuid", "p_qty_in_base_units" numeric, "p_over_sell_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stock_from_transfer_item"("p_stock_id" "uuid", "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  ---------------------------------------------------------------------
  -- Restar directamente la cantidad transferida:
  --    - quantity
  --    - reserved_for_transfering_quantity
  -- Valores negativos permitidos (sin greatest())
  ---------------------------------------------------------------------

  update public.stock
  set
    quantity = coalesce(quantity, 0) - coalesce(p_quantity, 0),
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) - coalesce(p_quantity, 0),
    updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."stock_from_transfer_item"("p_stock_id" "uuid", "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subtract_stock_quantity"("p_stock_id" "uuid", "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."subtract_stock_quantity"("p_stock_id" "uuid", "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
begin
  update transfer_orders
  set
    notes = p_transfer_order->>'notes',
    status = (p_transfer_order->>'status')::movement_status,
    updated_at = now()
  where transfer_order_id = (p_transfer_order->>'transfer_order_id')::bigint
  returning transfer_order_id into v_transfer_order_id;

  if v_transfer_order_id is null then
    raise exception 'Transfer order not found: %', p_transfer_order->>'transfer_order_id';
  end if;

  return v_transfer_order_id;
end;
$$;


ALTER FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb := '[]'::jsonb;
  item jsonb;
  original_item jsonb;
  v_item_id bigint;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    original_item := item;  
    v_item_id := nullif(original_item->>'transfer_order_item_id', '')::bigint;

    ---------------------------------------------------------------------
    -- UPDATE del transfer_order_item existente
    ---------------------------------------------------------------------
    update public.transfer_order_items
    set
      quantity = nullif(original_item->>'quantity','')::numeric,
      status = (original_item->>'status')::movement_status,
      is_transferred = coalesce((original_item->>'is_transferred')::boolean, false),
      stock_id = nullif(original_item->>'stock_id','')::bigint,
      updated_at = now()
    where transfer_order_item_id = v_item_id
    returning to_jsonb(public.transfer_order_items.*)
    into item;

    ---------------------------------------------------------------------
    -- 🔥 Restar la cantidad directamente del stock (sin cálculos)
    ---------------------------------------------------------------------
    perform public.stock_from_transfer_item(
      (item->>'stock_id')::bigint,
      (original_item->>'quantity')::numeric
    );
    
       ---------------------------------------------------------------------
    -- 🔥 Restar la cantidad directamente del stock (sin cálculos)
    ---------------------------------------------------------------------
   perform public.stock_to_transfer_item(
   (original_item->>'to_stock_type')::stock_type,
  (original_item->>'to_location_id')::bigint,
  (original_item->>'quantity')::numeric,
  (item->>'product_id')::bigint,
  (item->>'lot_id')::bigint
);

    ---------------------------------------------------------------------
    -- Movimiento de lot containers (si corresponde)
    ---------------------------------------------------------------------
   -- perform public.lot_containers_movements(
   --   v_item_id,
   --   original_item->'lot_containers_movements'
   -- );

    v_items := v_items || jsonb_build_array(item);
  end loop;

  return v_items;
end;
$$;


ALTER FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
  v_items jsonb;
begin
  -- 1️⃣ Update the header
  v_transfer_order_id := public.transfer_order_header(p_transfer_order);

  -- 2️⃣ Update the items
  v_items := public.transfer_order_items(v_transfer_order_id, p_transfer_order_items);

  -- 3️⃣ Final response
  return jsonb_build_object(
    'transfer_order_id', v_transfer_order_id,
    'items', v_items
  );
end;
$$;


ALTER FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  item jsonb;
  v_result jsonb := '[]'::jsonb;
  v_movement_id bigint;
  v_prev_qty numeric;
begin
 
  -- Iterate through movement entries
  for item in select * from jsonb_array_elements(p_movements)
  loop
    raise notice '➡ Procesando movimiento: %', item;

    v_movement_id := nullif(item->>'lot_container_movement_id', '')::bigint;
    raise notice '   movement_id = %', v_movement_id;


    --------------------------------------------------------------------
    -- INSERT
    --------------------------------------------------------------------
    if (item->>'is_new')::boolean = true then

      raise notice '🟢 INSERT en lot_containers_movements';

      insert into public.lot_containers_movements (
        quantity,
        from_location_id,
        to_location_id,
        from_provider_id,
        to_provider_id,
        from_client_id,
        to_client_id,
        lot_container_id,
        created_at
      )
      values (
        nullif(item->>'quantity','')::numeric,
        nullif(item->>'from_location_id','')::bigint,
        nullif(item->>'to_location_id','')::bigint,
        nullif(item->>'from_provider_id','')::bigint,
        nullif(item->>'to_provider_id','')::bigint,
        nullif(item->>'from_client_id','')::bigint,
        nullif(item->>'to_client_id','')::bigint,
        nullif(item->>'lot_container_id','')::bigint,
        now()
      )
      returning to_jsonb(lot_containers_movements.*)
      into item;

      raise notice '✔ INSERT OK: %', item;

      v_result := v_result || jsonb_build_array(item);

    --------------------------------------------------------------------
    -- UPDATE
    --------------------------------------------------------------------
    else

      raise notice '🟡 UPDATE en lot_containers_movements';

      select quantity
      into v_prev_qty
      from public.lot_containers_movements
      where lot_container_movement_id = v_movement_id;

      update public.lot_containers_movements
      set 
        quantity = nullif(item->>'quantity','')::numeric,
        from_location_id = nullif(item->>'from_location_id','')::bigint,
        to_location_id = nullif(item->>'to_location_id','')::bigint,
        from_provider_id = nullif(item->>'from_provider_id','')::bigint,
        to_provider_id = nullif(item->>'to_provider_id','')::bigint,
        from_client_id = nullif(item->>'from_client_id','')::bigint,
        to_client_id = nullif(item->>'to_client_id','')::bigint,
        lot_container_id = nullif(item->>'lot_container_id','')::bigint,
        created_at = now()
      where lot_container_movement_id = v_movement_id
      returning to_jsonb(lot_containers_movements.*)
      into item;

      raise notice '✔ UPDATE OK: %', item;

      v_result := v_result || jsonb_build_array(item);

    end if;

  end loop;



  return v_result;
end;
$$;


ALTER FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total numeric;
begin

  -- Sumar todo el stock del lote
  select coalesce(sum(quantity), 0)
  into v_total
  from stock
  where lot_id = p_lot_id;


  if v_total <= 0 then

    update lots
    set is_sold_out = true,
        updated_at = now()
    where lot_id = p_lot_id;
  else
    -- FIX: revertir is_sold_out cuando hay stock disponible
    update lots
    set is_sold_out = false,
        updated_at = now()
    where lot_id = p_lot_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_results jsonb := '[]'::jsonb;
  rec record;
  rec_container record;
  v_row jsonb;
begin
  ---------------------------------------------------------------------------
  -- 0) DELETE
  ---------------------------------------------------------------------------
  if p_delete_ids is not null and array_length(p_delete_ids, 1) > 0 then
    delete from prices
    where price_id = any(p_delete_ids);
  end if;

  ---------------------------------------------------------------------------
  -- 1) UPSERT
  ---------------------------------------------------------------------------
  for rec in
    select jsonb_array_elements(p_prices) as elem
  loop
    if (rec.elem->>'price_id') is not null and (rec.elem->>'price_id') <> 'null' then
      update prices
      set
        location_id             = (rec.elem->>'location_id')::bigint,
        product_presentation_id = (rec.elem->>'product_presentation_id')::bigint,
        price_number            = (rec.elem->>'price_number')::int,
        price                   = (rec.elem->>'price')::numeric,
        qty_per_price           = (rec.elem->>'qty_per_price')::numeric,
        profit_percentage       = (rec.elem->>'profit_percentage')::numeric,
        logic_type              = (rec.elem->>'logic_type')::logic_type,
        observations            = nullif(rec.elem->>'observations',''),
        valid_from              = nullif(rec.elem->>'valid_from','')::timestamptz,
        valid_until             = nullif(rec.elem->>'valid_until','')::timestamptz,
        updated_at              = now()
      where price_id = (rec.elem->>'price_id')::bigint
      returning row_to_json(prices.*)::jsonb into v_row;

      v_results := v_results || jsonb_build_array(v_row);
    else
      insert into prices (
        location_id, product_presentation_id, price_number, price,
        qty_per_price, profit_percentage, logic_type, observations,
        valid_from, valid_until
      )
      values (
        (rec.elem->>'location_id')::bigint,
        (rec.elem->>'product_presentation_id')::bigint,
        (rec.elem->>'price_number')::int,
        (rec.elem->>'price')::numeric,
        (rec.elem->>'qty_per_price')::numeric,
        (rec.elem->>'profit_percentage')::numeric,
        (rec.elem->>'logic_type')::logic_type,
        nullif(rec.elem->>'observations',''),
        nullif(rec.elem->>'valid_from','')::timestamptz,
        nullif(rec.elem->>'valid_until','')::timestamptz
      )
      returning row_to_json(prices.*)::jsonb into v_row;

      v_results := v_results || jsonb_build_array(v_row);
    end if;
  end loop;

  return v_results;
end;
$$;


ALTER FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" "uuid", "p_new_qty" numeric, "p_prev_qty" numeric DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_delta numeric;
begin
  -- If previous qty is null, assume it's a new item
  p_prev_qty := coalesce(p_prev_qty, 0);

  -- Difference between new and old quantity
  v_delta := p_new_qty - p_prev_qty;

  -- Update reserved quantity for transfers
  update public.stock
  set
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) + v_delta,
    updated_at = now()
  where stock_id = p_stock_id;

end;
$$;


ALTER FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" "uuid", "p_new_qty" numeric, "p_prev_qty" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_waste"("p_stock_id" "uuid", "p_qty_in_base_units" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_current_qty numeric;
begin
  select quantity
  into v_current_qty
  from stock
  where stock_id = p_stock_id
  for update;

  if not found then
    raise exception 'Stock not found (id=%)', p_stock_id;
  end if;

  if v_current_qty < p_qty_in_base_units then
    raise exception
      'Insufficiente stock. Actual: %, Requerido para merma: %',
      v_current_qty, p_qty_in_base_units;
  end if;

  update stock
  set
    quantity = quantity - p_qty_in_base_units,
    updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."update_stock_waste"("p_stock_id" "uuid", "p_qty_in_base_units" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
begin
  update transfer_orders
  set
    assigned_user_id = nullif(p_transfer_order->>'assigned_user_id','')::uuid,
    from_location_id = nullif(p_transfer_order->>'from_location_id','')::bigint,
    to_location_id = nullif(p_transfer_order->>'to_location_id','')::bigint,
    notes = p_transfer_order->>'notes',
    status = (p_transfer_order->>'status')::movement_status,
    updated_at = now()
  where transfer_order_id = (p_transfer_order->>'transfer_order_id')::bigint
  returning transfer_order_id into v_transfer_order_id;

  if v_transfer_order_id is null then
    raise exception 'Transfer order not found: %', p_transfer_order->>'transfer_order_id';
  end if;

  return v_transfer_order_id;
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb := '[]'::jsonb;
  item jsonb;
  original_item jsonb;
  v_item_id bigint;
  v_prev_qty numeric;
  v_prev_stock_id uuid;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    original_item := item;
    v_item_id := nullif(original_item->>'transfer_order_item_id', '')::bigint;

   -------------------------------------------------------------------
    -- DELETE
    -------------------------------------------------------------------
    if coalesce((original_item->>'is_deleted')::boolean, false) = true then

      select quantity, stock_id
      into v_prev_qty, v_prev_stock_id
      from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      perform public.update_stock_from_transfer_item(
        v_prev_stock_id,
        0,
        v_prev_qty
      );

      perform public.update_lot_containers_movements(
        v_item_id,
        '[]'::jsonb
      );

      delete from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      continue;
    end if;

    -------------------------------------------------------------------
    -- INSERT
    -------------------------------------------------------------------
    if (original_item->>'is_new')::boolean = true then

      insert into public.transfer_order_items (
        transfer_order_id,
        product_id,
        product_presentation_id,
        lot_id,
        quantity,
        status,
        is_transferred,
        stock_id,
        created_at,
        updated_at
      )
      values (
        p_transfer_order_id,
        nullif(original_item->>'product_id','')::bigint,
        nullif(original_item->>'product_presentation_id','')::bigint,
        nullif(original_item->>'lot_id','')::bigint,
        nullif(original_item->>'quantity','')::numeric,
        (original_item->>'status')::movement_status,
        coalesce((original_item->>'is_transferred')::boolean, false),
        nullif(original_item->>'stock_id','')::uuid,
        now(),
        now()
      )
      returning to_jsonb(public.transfer_order_items.*)
      into item;

      perform public.update_stock_from_transfer_item(
        (item->>'stock_id')::uuid,
        (original_item->>'quantity')::numeric,
        0
      );

      perform public.update_lot_containers_movements(
        (item->>'transfer_order_item_id')::bigint,
        original_item->'lot_containers_movements'
      );

    -------------------------------------------------------------------
    -- UPDATE
    -------------------------------------------------------------------
    else
      select quantity
      into v_prev_qty
      from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      update public.transfer_order_items
      set
        product_id = nullif(original_item->>'product_id','')::bigint,
        product_presentation_id = nullif(original_item->>'product_presentation_id','')::bigint,
        lot_id = nullif(original_item->>'lot_id','')::bigint,
        quantity = nullif(original_item->>'quantity','')::numeric,
        status = (original_item->>'status')::movement_status,
        is_transferred = coalesce((original_item->>'is_transferred')::boolean, false),
        stock_id = nullif(original_item->>'stock_id','')::uuid,
        updated_at = now()
      where transfer_order_item_id = v_item_id
      returning to_jsonb(public.transfer_order_items.*)
      into item;

      perform public.update_stock_from_transfer_item(
        (item->>'stock_id')::uuid,
        (original_item->>'quantity')::numeric,
        v_prev_qty
      );

      perform public.update_lot_containers_movements(
        v_item_id,
        original_item->'lot_containers_movements'
      );

    end if;

    v_items := v_items || jsonb_build_array(item);
  end loop;

  return v_items;
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
  v_items jsonb;
begin
  -- 1️⃣ Update the header
  v_transfer_order_id := public.update_transfer_order_header(p_transfer_order);

  -- 2️⃣ Update the items
  v_items := public.update_transfer_order_items(v_transfer_order_id, p_transfer_order_items);

  -- 3️⃣ Final response
  return jsonb_build_object(
    'transfer_order_id', v_transfer_order_id,
    'items', v_items
  );
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_integration_credentials"("p_organization_id" "uuid", "p_provider" "text", "p_credentials" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_key text;
    v_id  bigint;
BEGIN
    IF (SELECT role FROM users WHERE id = auth.uid()) NOT IN ('OWNER', 'MANAGER') THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'integration_credentials_key';

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;

    INSERT INTO integration_credentials (organization_id, provider, credentials_encrypted)
    VALUES (
        p_organization_id,
        p_provider,
        extensions.pgp_sym_encrypt(p_credentials::text, v_key)
    )
    ON CONFLICT (organization_id, provider)
    DO UPDATE SET
        credentials_encrypted = extensions.pgp_sym_encrypt(p_credentials::text, v_key),
        updated_at = now()
    RETURNING credential_id INTO v_id;

    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."upsert_integration_credentials"("p_organization_id" "uuid", "p_provider" "text", "p_credentials" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_mp_pos_config"("p_organization_id" "uuid", "p_terminal_id" bigint, "p_location_id" bigint, "p_mp_pos_external_id" "text", "p_mp_store_id" "text" DEFAULT NULL::"text", "p_mp_store_external_id" "text" DEFAULT NULL::"text", "p_mp_pos_id" "text" DEFAULT NULL::"text", "p_mp_qr_uuid" "text" DEFAULT NULL::"text", "p_mp_qr_image_url" "text" DEFAULT NULL::"text", "p_mp_point_device_id" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_id bigint;
BEGIN
    IF (SELECT role FROM users WHERE id = auth.uid()) NOT IN ('OWNER', 'MANAGER') THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

    INSERT INTO mp_pos_config (
        organization_id, terminal_id, location_id,
        mp_store_id, mp_store_external_id,
        mp_pos_id, mp_pos_external_id,
        mp_qr_uuid, mp_qr_image_url, mp_point_device_id
    )
    VALUES (
        p_organization_id, p_terminal_id, p_location_id,
        p_mp_store_id, p_mp_store_external_id,
        p_mp_pos_id, p_mp_pos_external_id,
        p_mp_qr_uuid, p_mp_qr_image_url, p_mp_point_device_id
    )
    ON CONFLICT (terminal_id)
    DO UPDATE SET
        location_id            = p_location_id,
        mp_store_id            = p_mp_store_id,
        mp_store_external_id   = p_mp_store_external_id,
        mp_pos_id              = p_mp_pos_id,
        mp_pos_external_id     = p_mp_pos_external_id,
        mp_qr_uuid             = p_mp_qr_uuid,
        mp_qr_image_url        = p_mp_qr_image_url,
        mp_point_device_id     = p_mp_point_device_id,
        is_active              = true,
        updated_at             = now(),
        deleted_at             = NULL
    RETURNING mp_pos_config_id INTO v_id;

    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."upsert_mp_pos_config"("p_organization_id" "uuid", "p_terminal_id" bigint, "p_location_id" bigint, "p_mp_pos_external_id" "text", "p_mp_store_id" "text", "p_mp_store_external_id" "text", "p_mp_pos_id" "text", "p_mp_qr_uuid" "text", "p_mp_qr_image_url" "text", "p_mp_point_device_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_rpc_schema_compatibility"() RETURNS TABLE("function_name" "text", "suspicious_columns" "text"[], "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  rec record;
  func_body text;
  col text;
  missing_cols text[];
  legacy_columns text[];
BEGIN
  legacy_columns := ARRAY[
    'current_quantity',
    'store_id',
    'stock_room_id',
    'last_updated',
    'business_owner_id',
    'final_cost_per_bulk',
    'final_cost_total',
    'purchase_cost_total',
    'download_cost_per_bulk',
    'purchase_cost_per_bulk',
    'from_stock_room_id',
    'to_stock_room_id',
    'from_store_id',
    'to_store_id'
  ];

  FOR rec IN
    SELECT
      p.proname AS func_name,
      pg_get_functiondef(p.oid) AS func_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname
  LOOP
    missing_cols := ARRAY[]::text[];

    FOREACH col IN ARRAY legacy_columns
    LOOP
      IF rec.func_def ILIKE '%' || col || '%' THEN
        missing_cols := missing_cols || col;
      END IF;
    END LOOP;

    IF array_length(missing_cols, 1) > 0 THEN
      RETURN QUERY SELECT
        rec.func_name::text,
        missing_cols,
        CASE
          WHEN rec.func_name IN ('transfer_stock', 'create_order', 'create_load_order_with_lots_and_prices')
            THEN '⚠️ Candidata a eliminar (legacy)'
          ELSE '🔍 Revisar manualmente'
        END;
    END IF;

  END LOOP;
END;
$$;


ALTER FUNCTION "public"."validate_rpc_schema_compatibility"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "brand_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "brand_name" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


ALTER TABLE "public"."brands" ALTER COLUMN "brand_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."brands_brand_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_name" character varying(255) NOT NULL,
    "slug" character varying(255),
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "category_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "category_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categories_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."client_transactions" (
    "transaction_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "transaction_type" "public"."transaction_type" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "transaction_date" timestamp with time zone,
    "payment_method" "public"."payment_method",
    "payment_status" "public"."payment_status",
    "balance_after_transaction" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "client_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY (ARRAY[('INVOICE'::character varying)::"text", ('PAYMENT'::character varying)::"text", ('CREDIT_NOTE'::character varying)::"text", ('DEBIT_NOTE'::character varying)::"text", ('ADJUSTMENT'::character varying)::"text"])))
);


ALTER TABLE "public"."client_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "client_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" character varying(150) NOT NULL,
    "email" character varying(150),
    "phone" character varying(50),
    "document_number" character varying(50),
    "address" "text",
    "city" character varying(100),
    "province" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100) DEFAULT 'Argentina'::character varying,
    "has_credit" boolean DEFAULT false,
    "credit_limit" numeric(12,2) DEFAULT 0,
    "current_balance" numeric(12,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "last_transaction_date" timestamp with time zone,
    "tax_condition" "public"."tax_condition_type" DEFAULT 'FINAL_CONSUMER'::"public"."tax_condition_type" NOT NULL,
    "billing_enabled" boolean DEFAULT true NOT NULL,
    "available_credit" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax_ident" "text",
    "short_code" smallint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disabled_prices" (
    "id" bigint NOT NULL,
    "price_id" bigint NOT NULL,
    "location_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."disabled_prices" OWNER TO "postgres";


ALTER TABLE "public"."disabled_prices" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."disabled_prices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."enabled_prices_clients" (
    "id" bigint NOT NULL,
    "price_id" bigint NOT NULL,
    "client_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."enabled_prices_clients" OWNER TO "postgres";


ALTER TABLE "public"."enabled_prices_clients" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."enabled_prices_clients_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integration_credentials" (
    "credential_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "credentials_encrypted" "bytea" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."integration_credentials" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_credentials" OWNER TO "postgres";


ALTER TABLE "public"."integration_credentials" ALTER COLUMN "credential_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."integration_credentials_credential_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."iva" (
    "iva_id" bigint NOT NULL,
    "iva_number" smallint NOT NULL,
    "iva_percentege" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."iva" OWNER TO "postgres";


ALTER TABLE "public"."iva" ALTER COLUMN "iva_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."iva_iva_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."load_orders" (
    "load_order_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recieved_by" "uuid",
    "recieved_by_other" "text",
    "invoice_number" bigint,
    "load_order_number" bigint,
    "provider_id" bigint,
    "delivery_date" timestamp with time zone,
    "receptor_id" "uuid",
    "receptor_other" "text",
    "transporter_data" "jsonb",
    "status" "text",
    "observations" "text",
    "total_download_cost" numeric,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."load_orders" OWNER TO "postgres";


ALTER TABLE "public"."load_orders" ALTER COLUMN "load_order_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."loading_orders_loading_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."locations" (
    "location_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" NOT NULL,
    "address" "text",
    "name" "text",
    "deleted_at" timestamp with time zone,
    "organization_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."locations" IS 'locations can be stores or sotockrooms';



ALTER TABLE "public"."locations" ALTER COLUMN "location_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."locations_location_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers" (
    "lot_container_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lot_container_name" "text",
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "lot_container_price" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."lot_containers" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers" ALTER COLUMN "lot_container_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lot_container_lot_container_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers_movements" (
    "lot_container_movement_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quantity" bigint,
    "from_location_id" bigint,
    "to_location_id" bigint,
    "from_provider_id" bigint,
    "to_provider_id" bigint,
    "from_client_id" "uuid",
    "to_client_id" "uuid",
    "lot_container_id" bigint,
    "status" "public"."movement_status",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."lot_containers_movements" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers_movements" ALTER COLUMN "lot_container_movement_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lot_container_movement_lot_container_movement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers_stock" (
    "lot_containers_stock_id" bigint NOT NULL,
    "lot_container_id" bigint,
    "quantity" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "provider_id" bigint,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "stock_id" "uuid",
    "location_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."lot_containers_stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lot_traces" (
    "lot_trace_id" bigint NOT NULL,
    "lot_from_id" bigint NOT NULL,
    "lot_to_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transformation_id" bigint
);


ALTER TABLE "public"."lot_traces" OWNER TO "postgres";


ALTER TABLE "public"."lot_traces" ALTER COLUMN "lot_trace_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."lot_traces_lot_trace_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lots" (
    "lot_id" smallint NOT NULL,
    "provider_id" bigint,
    "expiration_date" "date",
    "expiration_date_notification" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "initial_stock_quantity" numeric,
    "is_sold_out" boolean,
    "is_expired" boolean,
    "load_order_id" bigint,
    "product_id" bigint,
    "purchase_cost_per_unit" numeric,
    "download_cost_per_unit" numeric,
    "final_cost_per_unit" numeric,
    "delivery_cost_per_unit" numeric,
    "productor_commission_type" "public"."commission_type" DEFAULT 'NONE'::"public"."commission_type" NOT NULL,
    "productor_commission_percentage" numeric,
    "productor_commission_unit_value" numeric,
    "purchasing_agent_id" integer,
    "purchasing_agent_commision_type" "public"."commission_type" DEFAULT 'NONE'::"public"."commission_type" NOT NULL,
    "purchasing_agent_commision_percentage" numeric,
    "purchasing_agent_commision_unit_value" numeric,
    "is_finished" boolean,
    "extra_cost_per_unit" numeric,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."lots" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers_stock" ALTER COLUMN "lot_containers_stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lots_lot_containers_lots_lot_containers_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mp_pos_config" (
    "mp_pos_config_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "terminal_id" bigint NOT NULL,
    "location_id" bigint NOT NULL,
    "mp_store_id" "text",
    "mp_store_external_id" "text",
    "mp_pos_id" "text",
    "mp_pos_external_id" "text" NOT NULL,
    "mp_qr_uuid" "text",
    "mp_qr_image_url" "text",
    "mp_point_device_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."mp_pos_config" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mp_pos_config" OWNER TO "postgres";


ALTER TABLE "public"."mp_pos_config" ALTER COLUMN "mp_pos_config_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."mp_pos_config_mp_pos_config_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "notification_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text",
    "title" "text",
    "message" "text",
    "order_id" "uuid",
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "canceled_by" "uuid",
    "location_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "notification_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_notification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "order_item_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" numeric(12,3) NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "total" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subtotal" bigint,
    "discount" bigint,
    "tax" bigint,
    "is_deleted" boolean,
    "logic_type" "public"."logic_type",
    "product_presentation_id" bigint,
    "stock_id" "uuid",
    "status" "public"."movement_status",
    "location_id" bigint,
    "lot_id" smallint,
    "over_sell_quantity" numeric,
    "updated_at" timestamp with time zone,
    "qty_in_base_units" numeric
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "organization_name" "text",
    "max_terminals" numeric DEFAULT '1'::numeric
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "payment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_id" "uuid",
    "amount" bigint,
    "payment_method" "public"."payment_method",
    "payment_type" "public"."payment_type",
    "payment_direction" "public"."payment_direction",
    "client_id" "uuid",
    "provider_id" bigint,
    "terminal_session_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_presentations" (
    "product_presentation_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_presentation_name" "text",
    "short_code" bigint,
    "product_id" bigint,
    "deleted_at" timestamp with time zone,
    "bulk_quantity_equivalence" numeric,
    "updated_at" timestamp with time zone,
    "sell_type" "public"."sell_type",
    "organization_id" "uuid",
    "sell_unit" "public"."sell_unit",
    "auto_stock_calc" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."product_presentations" OWNER TO "postgres";


ALTER TABLE "public"."product_presentations" ALTER COLUMN "product_presentation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."presentations_presentation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."prices" (
    "price_number" bigint,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "price_id" bigint NOT NULL,
    "price" numeric,
    "logic_type" "public"."logic_type",
    "qty_per_price" numeric,
    "profit_percentage" numeric,
    "observations" "text",
    "product_presentation_id" bigint,
    "location_id" bigint,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


ALTER TABLE "public"."lots" ALTER COLUMN "lot_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_lots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."prices" ALTER COLUMN "price_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_prices_product_price_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_name" "text" NOT NULL,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "barcode" bigint,
    "short_code" bigint,
    "product_id" bigint NOT NULL,
    "category_id" bigint,
    "sub_category_id" bigint,
    "provider_id" bigint,
    "allow_stock_control" boolean,
    "brand_id" bigint,
    "public_image_id" bigint,
    "product_description" "text",
    "observations" "text",
    "parent_product_id" bigint,
    "lot_control" boolean,
    "iva_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."barcode" IS 'barcode';



ALTER TABLE "public"."products" ALTER COLUMN "product_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_product_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."providers" (
    "provider_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_At" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "provider_name" "text",
    "short_code" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


ALTER TABLE "public"."providers" ALTER COLUMN "provider_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."providers_provider_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."public_images" (
    "public_image_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "public_image_src" "text" NOT NULL,
    "public_image_category" "text" NOT NULL,
    "public_image_name" "text" NOT NULL
);


ALTER TABLE "public"."public_images" OWNER TO "postgres";


ALTER TABLE "public"."public_images" ALTER COLUMN "public_image_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."public_images_public_image_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchasing_agents" (
    "purchasing_agent_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "purchasing_agent_name" "text",
    "organization_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."purchasing_agents" OWNER TO "postgres";


ALTER TABLE "public"."purchasing_agents" ALTER COLUMN "purchasing_agent_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."purchasing_agent_purchasing_agent_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock" (
    "stock_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lot_id" bigint NOT NULL,
    "quantity" numeric(18,3) DEFAULT 0 NOT NULL,
    "min_notification" numeric(18,3) DEFAULT 0,
    "max_notification" numeric(18,3) DEFAULT 0,
    "transformed_from_product_id" bigint,
    "transformed_to_product_id" bigint,
    "stock_type" "public"."stock_type",
    "product_id" bigint,
    "reserved_for_transferring_quantity" numeric,
    "reserved_for_selling_quantity" numeric,
    "location_id" bigint,
    "is_closed" boolean DEFAULT false,
    "over_sell_quantity" numeric,
    "product_presentation_id" bigint,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "stock_movement_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lot_id" bigint,
    "movement_type" "public"."movement_type",
    "quantity" numeric,
    "to_location_id" bigint,
    "should_notify_owner" boolean,
    "from_location_id" bigint,
    "price" numeric,
    "created_by" "uuid",
    "stock_id" "uuid",
    "product_presentation_id" bigint,
    "qty_in_base_units" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_order_sequences" (
    "store_order_sequence_id" bigint NOT NULL,
    "location_id" bigint,
    "last_number" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."store_order_sequences" OWNER TO "postgres";


ALTER TABLE "public"."store_order_sequences" ALTER COLUMN "store_order_sequence_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."store_order_sequences_store_order_sequence_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sub_categories" (
    "sub_category_name" character varying(255) NOT NULL,
    "slug" character varying(255),
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "sub_category_id" bigint NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."sub_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."sub_categories" IS 'This is a duplicate of categories';



ALTER TABLE "public"."sub_categories" ALTER COLUMN "sub_category_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sub_categories_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."terminal_sessions" (
    "terminal_session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "terminal_id" bigint NOT NULL,
    "opened_by_user_id" "uuid" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "opening_balance" numeric DEFAULT 0 NOT NULL,
    "closing_balance" numeric,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "location_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."terminal_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."terminals" (
    "terminal_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."terminals" OWNER TO "postgres";


ALTER TABLE "public"."terminals" ALTER COLUMN "terminal_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."terminals_terminal_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transfer_order_items" (
    "transfer_order_item_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transfer_order_id" bigint,
    "product_id" bigint,
    "quantity" numeric,
    "product_presentation_id" bigint,
    "status" "public"."movement_status",
    "stock_id" "uuid",
    "lot_containers_movement_id" bigint,
    "updated_at" timestamp with time zone,
    "lot_id" smallint,
    "is_transferred" boolean
);


ALTER TABLE "public"."transfer_order_items" OWNER TO "postgres";


ALTER TABLE "public"."transfer_order_items" ALTER COLUMN "transfer_order_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transfer_order_items_transfer_order_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transfer_orders" (
    "transfer_order_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_user_id" "uuid",
    "notes" "text",
    "status" "public"."movement_status" DEFAULT 'PENDING'::"public"."movement_status" NOT NULL,
    "from_location_id" bigint,
    "to_location_id" bigint,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."transfer_orders" OWNER TO "postgres";


ALTER TABLE "public"."transfer_orders" ALTER COLUMN "transfer_order_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transfer_orders_transfer_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transformation_items" (
    "transformation_item_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_id" bigint,
    "product_presentation_id" bigint,
    "lot_id" bigint,
    "stock_id" "uuid",
    "is_origin" boolean DEFAULT false NOT NULL,
    "quantity" numeric,
    "max_quantity" numeric,
    "bulk_quantity_equivalence" numeric,
    "final_cost_per_unit" numeric,
    "location_id" bigint,
    "transformation_id" bigint,
    "qty_in_base_units" numeric
);


ALTER TABLE "public"."transformation_items" OWNER TO "postgres";


ALTER TABLE "public"."transformation_items" ALTER COLUMN "transformation_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transformation_items_transformation_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transformations" (
    "transformation_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transformation_cost" numeric,
    "notes" "text",
    "transformation_type" "public"."transformation_type" DEFAULT 'TRANSFORMATION'::"public"."transformation_type" NOT NULL,
    "organization_id" "uuid",
    "created_by" "uuid"
);


ALTER TABLE "public"."transformations" OWNER TO "postgres";


ALTER TABLE "public"."transformations" ALTER COLUMN "transformation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."trasnformations_transformation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "phone" character varying(20),
    "address" "jsonb",
    "role" "public"."user_role_enum" DEFAULT 'OWNER'::"public"."user_role_enum" NOT NULL,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "business_owner_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "short_code" smallint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."business_owner_id" IS 'User''s direct manager in the hierarchy';



CREATE TABLE IF NOT EXISTS "public"."website_preferences" (
    "id" "uuid" NOT NULL,
    "theme" character varying(50) DEFAULT 'default'::character varying,
    "primary_color" character varying(7) DEFAULT '#6b99fe'::character varying,
    "secondary_color" character varying(7) DEFAULT '#f4b700'::character varying,
    "logo_url" "text",
    "favicon_url" "text",
    "homepage_layout" "jsonb",
    "custom_css" "text",
    "language" character varying(10) DEFAULT 'es'::character varying,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."website_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_category_id_key" UNIQUE ("category_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id");



ALTER TABLE ONLY "public"."disabled_prices"
    ADD CONSTRAINT "disabled_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disabled_prices"
    ADD CONSTRAINT "disabled_prices_price_id_location_id_key" UNIQUE ("price_id", "location_id");



ALTER TABLE ONLY "public"."enabled_prices_clients"
    ADD CONSTRAINT "enabled_prices_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enabled_prices_clients"
    ADD CONSTRAINT "enabled_prices_clients_price_id_location_id_key" UNIQUE ("price_id", "client_id");



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("credential_id");



ALTER TABLE ONLY "public"."iva"
    ADD CONSTRAINT "iva_pkey" PRIMARY KEY ("iva_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_pkey" PRIMARY KEY ("load_order_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_pkey" PRIMARY KEY ("lot_container_movement_id");



ALTER TABLE ONLY "public"."lot_containers"
    ADD CONSTRAINT "lot_container_pkey" PRIMARY KEY ("lot_container_id");



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_pkey" PRIMARY KEY ("lot_trace_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lots_lot_containers_pkey" PRIMARY KEY ("lot_containers_stock_id");



ALTER TABLE ONLY "public"."mp_pos_config"
    ADD CONSTRAINT "mp_pos_config_pkey" PRIMARY KEY ("mp_pos_config_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("product_presentation_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "product_lots_pkey" PRIMARY KEY ("lot_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "product_prices_pkey" PRIMARY KEY ("price_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "product_prices_product_price_id_key" UNIQUE ("price_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("provider_id");



ALTER TABLE ONLY "public"."public_images"
    ADD CONSTRAINT "public_images_pkey" PRIMARY KEY ("public_image_id");



ALTER TABLE ONLY "public"."purchasing_agents"
    ADD CONSTRAINT "purchasing_agent_pkey" PRIMARY KEY ("purchasing_agent_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("stock_movement_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_pkey" PRIMARY KEY ("stock_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_pkey" PRIMARY KEY ("store_order_sequence_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_store_id_key" UNIQUE ("location_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_category_id_key" UNIQUE ("sub_category_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("sub_category_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_pkey" PRIMARY KEY ("terminal_session_id");



ALTER TABLE ONLY "public"."terminals"
    ADD CONSTRAINT "terminals_pkey" PRIMARY KEY ("terminal_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_pkey" PRIMARY KEY ("transfer_order_item_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("transfer_order_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_pkey" PRIMARY KEY ("transformation_item_id");



ALTER TABLE ONLY "public"."transformations"
    ADD CONSTRAINT "trasnformations_pkey" PRIMARY KEY ("transformation_id");



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "uq_org_provider" UNIQUE ("organization_id", "provider");



ALTER TABLE ONLY "public"."mp_pos_config"
    ADD CONSTRAINT "uq_terminal_mp_pos" UNIQUE ("terminal_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."website_preferences"
    ADD CONSTRAINT "website_preferences_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_clients_organization_id" ON "public"."clients" USING "btree" ("organization_id");



CREATE INDEX "idx_foi_created_at" ON "public"."transfer_order_items" USING "btree" ("created_at");



CREATE INDEX "idx_foi_product_id" ON "public"."transfer_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_foi_transfer_order_id" ON "public"."transfer_order_items" USING "btree" ("transfer_order_id");



CREATE INDEX "idx_integration_credentials_lookup" ON "public"."integration_credentials" USING "btree" ("organization_id", "provider", "is_active");



CREATE INDEX "idx_integration_credentials_org_id" ON "public"."integration_credentials" USING "btree" ("organization_id");



CREATE INDEX "idx_iva_organization_id" ON "public"."iva" USING "btree" ("organization_id");



CREATE INDEX "idx_locations_organization_id" ON "public"."locations" USING "btree" ("organization_id");



CREATE INDEX "idx_lot_containers_org" ON "public"."lot_containers" USING "btree" ("organization_id");



CREATE INDEX "idx_lot_containers_stock_org" ON "public"."lot_containers_stock" USING "btree" ("organization_id");



CREATE INDEX "idx_mp_pos_config_location" ON "public"."mp_pos_config" USING "btree" ("location_id");



CREATE INDEX "idx_mp_pos_config_org" ON "public"."mp_pos_config" USING "btree" ("organization_id");



CREATE INDEX "idx_mp_pos_config_terminal" ON "public"."mp_pos_config" USING "btree" ("terminal_id");



CREATE INDEX "idx_notifications_org" ON "public"."notifications" USING "btree" ("organization_id");



CREATE INDEX "idx_orders_org" ON "public"."orders" USING "btree" ("organization_id");



CREATE INDEX "idx_product_presentations_org" ON "public"."product_presentations" USING "btree" ("organization_id");



CREATE INDEX "idx_providers_org" ON "public"."providers" USING "btree" ("organization_id");



CREATE INDEX "idx_transfer_orders_org" ON "public"."transfer_orders" USING "btree" ("organization_id");



CREATE INDEX "idx_user_profiles_type" ON "public"."users" USING "btree" ("role");



CREATE UNIQUE INDEX "one_open_session_per_terminal" ON "public"."terminal_sessions" USING "btree" ("terminal_id") WHERE ("status" = 'OPEN'::"text");



CREATE UNIQUE INDEX "stock_unique" ON "public"."stock" USING "btree" ("lot_id", "product_id", "location_id");



CREATE UNIQUE INDEX "unique_presentation_per_owner_and_product" ON "public"."product_presentations" USING "btree" ("organization_id", "product_id", "product_presentation_name") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "unique_shortcode_per_owner" ON "public"."product_presentations" USING "btree" ("organization_id", "product_id", "short_code") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "unique_terminal_name_per_org" ON "public"."terminals" USING "btree" ("organization_id", "name");



CREATE OR REPLACE TRIGGER "set_public_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."client_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."lot_containers_movements" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."lots" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."purchasing_agents" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."stock" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."stock_movements" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."store_order_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."terminal_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."terminals" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."disabled_prices"
    ADD CONSTRAINT "disabled_prices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."disabled_prices"
    ADD CONSTRAINT "disabled_prices_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("price_id");



ALTER TABLE ONLY "public"."enabled_prices_clients"
    ADD CONSTRAINT "enabled_prices_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."enabled_prices_clients"
    ADD CONSTRAINT "enabled_prices_clients_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("price_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "foi_product_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "foi_transfer_order_fk" FOREIGN KEY ("transfer_order_id") REFERENCES "public"."transfer_orders"("transfer_order_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_credentials"
    ADD CONSTRAINT "integration_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."iva"
    ADD CONSTRAINT "iva_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_receptor_id_fkey" FOREIGN KEY ("receptor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_recieved_by_fkey" FOREIGN KEY ("recieved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_from_client_id_fkey" FOREIGN KEY ("from_client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_from_provider_id_fkey" FOREIGN KEY ("from_provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_to_client_id_fkey" FOREIGN KEY ("to_client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_to_provider_id_fkey" FOREIGN KEY ("to_provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movements_lot_container_id_fkey" FOREIGN KEY ("lot_container_id") REFERENCES "public"."lot_containers"("lot_container_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_lot_container_id_fkey" FOREIGN KEY ("lot_container_id") REFERENCES "public"."lot_containers"("lot_container_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_containers_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_containers_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers"
    ADD CONSTRAINT "lot_containers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_stock_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_lot_from_fk" FOREIGN KEY ("lot_from_id") REFERENCES "public"."lots"("lot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_lot_to_fk" FOREIGN KEY ("lot_to_id") REFERENCES "public"."lots"("lot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_transformation_id_fkey" FOREIGN KEY ("transformation_id") REFERENCES "public"."transformations"("transformation_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_load_order_id_fkey" FOREIGN KEY ("load_order_id") REFERENCES "public"."load_orders"("load_order_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."mp_pos_config"
    ADD CONSTRAINT "mp_pos_config_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."mp_pos_config"
    ADD CONSTRAINT "mp_pos_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."mp_pos_config"
    ADD CONSTRAINT "mp_pos_config_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("terminal_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_terminal_session_id_fkey" FOREIGN KEY ("terminal_session_id") REFERENCES "public"."terminal_sessions"("terminal_session_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_terminal_session_fk" FOREIGN KEY ("terminal_session_id") REFERENCES "public"."terminal_sessions"("terminal_session_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "product_presentations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "product_presentations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("brand_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_iva_id_fkey" FOREIGN KEY ("iva_id") REFERENCES "public"."iva"("iva_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_parent_product_id_fkey" FOREIGN KEY ("parent_product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_public_image_id_fkey" FOREIGN KEY ("public_image_id") REFERENCES "public"."public_images"("public_image_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("sub_category_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."purchasing_agents"
    ADD CONSTRAINT "purchasing_agents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey1" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_opened_by_user_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("terminal_id");



ALTER TABLE ONLY "public"."terminals"
    ADD CONSTRAINT "terminals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_lot_containers_movement_id_fkey" FOREIGN KEY ("lot_containers_movement_id") REFERENCES "public"."lot_containers_movements"("lot_container_movement_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_assigned_user_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_transformation_id_fkey" FOREIGN KEY ("transformation_id") REFERENCES "public"."transformations"("transformation_id");



ALTER TABLE ONLY "public"."transformations"
    ADD CONSTRAINT "transformations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transformations"
    ADD CONSTRAINT "transformations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."website_preferences"
    ADD CONSTRAINT "website_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_delete" ON "public"."brands" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "brands_insert" ON "public"."brands" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "brands_select" ON "public"."brands" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "brands_update" ON "public"."brands" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_delete" ON "public"."categories" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "categories_insert" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "categories_select" ON "public"."categories" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "categories_update" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."client_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_transactions_delete" ON "public"."client_transactions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "client_transactions"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "client_transactions_insert" ON "public"."client_transactions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "client_transactions"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "client_transactions_select" ON "public"."client_transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "client_transactions"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "client_transactions_update" ON "public"."client_transactions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "client_transactions"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "client_transactions"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete" ON "public"."clients" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "clients_insert" ON "public"."clients" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "clients_update" ON "public"."clients" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."enabled_prices_clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enabled_prices_clients_delete" ON "public"."enabled_prices_clients" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "enabled_prices_clients"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "enabled_prices_clients_insert" ON "public"."enabled_prices_clients" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "enabled_prices_clients"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "enabled_prices_clients_select" ON "public"."enabled_prices_clients" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "enabled_prices_clients"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "enabled_prices_clients_update" ON "public"."enabled_prices_clients" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "enabled_prices_clients"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "enabled_prices_clients"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."integration_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iva" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "iva_delete" ON "public"."iva" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "iva_insert" ON "public"."iva" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "iva_select" ON "public"."iva" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "iva_update" ON "public"."iva" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."load_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "load_orders_delete" ON "public"."load_orders" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "load_orders_insert" ON "public"."load_orders" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "load_orders_select" ON "public"."load_orders" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "load_orders_update" ON "public"."load_orders" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_delete" ON "public"."locations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_select" ON "public"."locations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_update" ON "public"."locations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."lot_containers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lot_containers_delete" ON "public"."lot_containers" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "lot_containers_insert" ON "public"."lot_containers" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."lot_containers_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lot_containers_movements_delete" ON "public"."lot_containers_movements" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lot_containers" "lc"
  WHERE (("lc"."lot_container_id" = "lot_containers_movements"."lot_container_id") AND ("lc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_containers_movements_insert" ON "public"."lot_containers_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lot_containers" "lc"
  WHERE (("lc"."lot_container_id" = "lot_containers_movements"."lot_container_id") AND ("lc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_containers_movements_select" ON "public"."lot_containers_movements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lot_containers" "lc"
  WHERE (("lc"."lot_container_id" = "lot_containers_movements"."lot_container_id") AND ("lc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_containers_movements_update" ON "public"."lot_containers_movements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lot_containers" "lc"
  WHERE (("lc"."lot_container_id" = "lot_containers_movements"."lot_container_id") AND ("lc"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lot_containers" "lc"
  WHERE (("lc"."lot_container_id" = "lot_containers_movements"."lot_container_id") AND ("lc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_containers_select" ON "public"."lot_containers" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."lot_containers_stock" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lot_containers_stock_delete" ON "public"."lot_containers_stock" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "lot_containers_stock_insert" ON "public"."lot_containers_stock" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "lot_containers_stock_select" ON "public"."lot_containers_stock" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "lot_containers_stock_update" ON "public"."lot_containers_stock" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "lot_containers_update" ON "public"."lot_containers" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."lot_traces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lot_traces_delete" ON "public"."lot_traces" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "lot_traces"."lot_from_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_traces_insert" ON "public"."lot_traces" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "lot_traces"."lot_from_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_traces_select" ON "public"."lot_traces" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "lot_traces"."lot_from_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lot_traces_update" ON "public"."lot_traces" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "lot_traces"."lot_from_id") AND ("p"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "lot_traces"."lot_from_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."lots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lots_delete" ON "public"."lots" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."product_id" = "lots"."product_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lots_insert" ON "public"."lots" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."product_id" = "lots"."product_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lots_select" ON "public"."lots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."product_id" = "lots"."product_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "lots_update" ON "public"."lots" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."product_id" = "lots"."product_id") AND ("p"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."product_id" = "lots"."product_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."mp_pos_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mp_pos_org_members_select" ON "public"."mp_pos_config" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "u"."organization_id"
   FROM "public"."users" "u"
  WHERE ("u"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "mp_pos_owner_manager_delete" ON "public"."mp_pos_config" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "u"."organization_id"
   FROM "public"."users" "u"
  WHERE (("u"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("u"."role" = ANY (ARRAY['OWNER'::"public"."user_role_enum", 'MANAGER'::"public"."user_role_enum"]))))));



CREATE POLICY "mp_pos_owner_manager_insert" ON "public"."mp_pos_config" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "u"."organization_id"
   FROM "public"."users" "u"
  WHERE (("u"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("u"."role" = ANY (ARRAY['OWNER'::"public"."user_role_enum", 'MANAGER'::"public"."user_role_enum"]))))));



CREATE POLICY "mp_pos_owner_manager_update" ON "public"."mp_pos_config" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "u"."organization_id"
   FROM "public"."users" "u"
  WHERE (("u"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("u"."role" = ANY (ARRAY['OWNER'::"public"."user_role_enum", 'MANAGER'::"public"."user_role_enum"])))))) WITH CHECK (("organization_id" IN ( SELECT "u"."organization_id"
   FROM "public"."users" "u"
  WHERE (("u"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("u"."role" = ANY (ARRAY['OWNER'::"public"."user_role_enum", 'MANAGER'::"public"."user_role_enum"]))))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_delete" ON "public"."order_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "order_items"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "order_items_insert" ON "public"."order_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "order_items"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "order_items_select" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "order_items"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "order_items_update" ON "public"."order_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "order_items"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "order_items"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete" ON "public"."orders" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "orders_insert" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "orders_select" ON "public"."orders" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "orders_update" ON "public"."orders" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_delete" ON "public"."organizations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "organizations_insert" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "organizations_select" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "organizations_update" ON "public"."organizations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_delete" ON "public"."payments" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "payments"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "payments"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "payments_insert" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "payments"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "payments"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "payments_select" ON "public"."payments" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "payments"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "payments"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "payments_update" ON "public"."payments" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "payments"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "payments"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"())))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."order_id" = "payments"."order_id") AND ("o"."organization_id" = "public"."current_organization_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."client_id" = "payments"."client_id") AND ("c"."organization_id" = "public"."current_organization_id"()))))));



ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prices_delete" ON "public"."prices" FOR DELETE TO "authenticated" USING ((("location_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "prices"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "prices_insert" ON "public"."prices" FOR INSERT TO "authenticated" WITH CHECK ((("location_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "prices"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "prices_select" ON "public"."prices" FOR SELECT TO "authenticated" USING ((("location_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "prices"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"()))))));



CREATE POLICY "prices_update" ON "public"."prices" FOR UPDATE TO "authenticated" USING ((("location_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "prices"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"())))))) WITH CHECK ((("location_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "prices"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"()))))));



ALTER TABLE "public"."product_presentations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_presentations_delete" ON "public"."product_presentations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "product_presentations_insert" ON "public"."product_presentations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "product_presentations_select" ON "public"."product_presentations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "product_presentations_update" ON "public"."product_presentations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete" ON "public"."products" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "products_insert" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "products_select" ON "public"."products" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "providers_delete" ON "public"."providers" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "providers_insert" ON "public"."providers" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "providers_select" ON "public"."providers" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "providers_update" ON "public"."providers" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."public_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_images_select" ON "public"."public_images" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."purchasing_agents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchasing_agents_delete" ON "public"."purchasing_agents" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "purchasing_agents_insert" ON "public"."purchasing_agents" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "purchasing_agents_select" ON "public"."purchasing_agents" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "purchasing_agents_update" ON "public"."purchasing_agents" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."stock" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_delete" ON "public"."stock" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "stock"."lot_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_insert" ON "public"."stock" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "stock"."lot_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_movements_delete" ON "public"."stock_movements" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."stock" "s"
     JOIN "public"."lots" "l" ON (("l"."lot_id" = "s"."lot_id")))
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("s"."stock_id" = "stock_movements"."stock_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_movements_insert" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."stock" "s"
     JOIN "public"."lots" "l" ON (("l"."lot_id" = "s"."lot_id")))
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("s"."stock_id" = "stock_movements"."stock_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_movements_select" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."stock" "s"
     JOIN "public"."lots" "l" ON (("l"."lot_id" = "s"."lot_id")))
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("s"."stock_id" = "stock_movements"."stock_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_movements_update" ON "public"."stock_movements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."stock" "s"
     JOIN "public"."lots" "l" ON (("l"."lot_id" = "s"."lot_id")))
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("s"."stock_id" = "stock_movements"."stock_id") AND ("p"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."stock" "s"
     JOIN "public"."lots" "l" ON (("l"."lot_id" = "s"."lot_id")))
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("s"."stock_id" = "stock_movements"."stock_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_select" ON "public"."stock" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "stock"."lot_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "stock_update" ON "public"."stock" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "stock"."lot_id") AND ("p"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."lots" "l"
     JOIN "public"."products" "p" ON (("p"."product_id" = "l"."product_id")))
  WHERE (("l"."lot_id" = "stock"."lot_id") AND ("p"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."store_order_sequences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_order_sequences_delete" ON "public"."store_order_sequences" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "store_order_sequences"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "store_order_sequences_insert" ON "public"."store_order_sequences" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "store_order_sequences"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "store_order_sequences_select" ON "public"."store_order_sequences" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "store_order_sequences"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "store_order_sequences_update" ON "public"."store_order_sequences" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "store_order_sequences"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."locations" "loc"
  WHERE (("loc"."location_id" = "store_order_sequences"."location_id") AND ("loc"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."sub_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sub_categories_delete" ON "public"."sub_categories" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sub_categories_insert" ON "public"."sub_categories" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sub_categories_select" ON "public"."sub_categories" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sub_categories_update" ON "public"."sub_categories" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."terminal_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "terminal_sessions_delete" ON "public"."terminal_sessions" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminal_sessions_insert" ON "public"."terminal_sessions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminal_sessions_select" ON "public"."terminal_sessions" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminal_sessions_update" ON "public"."terminal_sessions" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."terminals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "terminals_delete" ON "public"."terminals" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminals_insert" ON "public"."terminals" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminals_select" ON "public"."terminals" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "terminals_update" ON "public"."terminals" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."transfer_order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transfer_order_items_delete" ON "public"."transfer_order_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transfer_orders" "t"
  WHERE (("t"."transfer_order_id" = "transfer_order_items"."transfer_order_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transfer_order_items_insert" ON "public"."transfer_order_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transfer_orders" "t"
  WHERE (("t"."transfer_order_id" = "transfer_order_items"."transfer_order_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transfer_order_items_select" ON "public"."transfer_order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transfer_orders" "t"
  WHERE (("t"."transfer_order_id" = "transfer_order_items"."transfer_order_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transfer_order_items_update" ON "public"."transfer_order_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transfer_orders" "t"
  WHERE (("t"."transfer_order_id" = "transfer_order_items"."transfer_order_id") AND ("t"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transfer_orders" "t"
  WHERE (("t"."transfer_order_id" = "transfer_order_items"."transfer_order_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."transfer_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transfer_orders_delete" ON "public"."transfer_orders" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transfer_orders_insert" ON "public"."transfer_orders" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transfer_orders_select" ON "public"."transfer_orders" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transfer_orders_update" ON "public"."transfer_orders" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."transformation_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transformation_items_delete" ON "public"."transformation_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transformations" "t"
  WHERE (("t"."transformation_id" = "transformation_items"."transformation_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transformation_items_insert" ON "public"."transformation_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transformations" "t"
  WHERE (("t"."transformation_id" = "transformation_items"."transformation_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transformation_items_select" ON "public"."transformation_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transformations" "t"
  WHERE (("t"."transformation_id" = "transformation_items"."transformation_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



CREATE POLICY "transformation_items_update" ON "public"."transformation_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transformations" "t"
  WHERE (("t"."transformation_id" = "transformation_items"."transformation_id") AND ("t"."organization_id" = "public"."current_organization_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transformations" "t"
  WHERE (("t"."transformation_id" = "transformation_items"."transformation_id") AND ("t"."organization_id" = "public"."current_organization_id"())))));



ALTER TABLE "public"."transformations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transformations_delete" ON "public"."transformations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transformations_insert" ON "public"."transformations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transformations_select" ON "public"."transformations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "transformations_update" ON "public"."transformations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete" ON "public"."users" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "users_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "users_update" ON "public"."users" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."website_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "website_preferences_delete" ON "public"."website_preferences" FOR DELETE TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "website_preferences_insert" ON "public"."website_preferences" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "website_preferences_select" ON "public"."website_preferences" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "website_preferences_update" ON "public"."website_preferences" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE PUBLICATION "powersync" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "powersync" OWNER TO "postgres";




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."brands";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."categories";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."client_transactions";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."clients";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."disabled_prices";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."enabled_prices_clients";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."iva";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."load_orders";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."locations";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."lot_containers";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."lot_containers_stock";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."lots";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."order_items";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."payments";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."prices";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."product_presentations";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."products";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."providers";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."stock";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."stock_movements";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."store_order_sequences";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_order_sequences";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."sub_categories";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."terminal_sessions";



ALTER PUBLICATION "powersync" ADD TABLE ONLY "public"."terminals";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" "uuid", "p_amount" numeric, "p_credit_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" "uuid", "p_amount" numeric, "p_credit_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" "uuid", "p_amount" numeric, "p_credit_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" "uuid", "p_stock_id" "uuid", "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" "uuid", "p_stock_id" "uuid", "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" "uuid", "p_stock_id" "uuid", "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" "uuid", "p_stock_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" "uuid", "p_stock_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" "uuid", "p_stock_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_integration_credentials"("p_organization_id" "uuid", "p_provider" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_integration_credentials"("p_organization_id" "uuid", "p_provider" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_integration_credentials"("p_organization_id" "uuid", "p_provider" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_integration_credentials_safe"("p_organization_id" "uuid", "p_provider" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_integration_credentials_safe"("p_organization_id" "uuid", "p_provider" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_integration_credentials_safe"("p_organization_id" "uuid", "p_provider" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_lot_costs"("p_product_presentation_id" bigint, OUT "final_cost_per_unit" numeric, OUT "final_cost_per_bulk" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_lot_costs"("p_product_presentation_id" bigint, OUT "final_cost_per_unit" numeric, OUT "final_cost_per_bulk" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_lot_costs"("p_product_presentation_id" bigint, OUT "final_cost_per_unit" numeric, OUT "final_cost_per_bulk" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_sales"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_sales"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_sales"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_transformations"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_transformations"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_transformations"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_wastes"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_wastes"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_wastes"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mp_credentials_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_mp_credentials_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mp_credentials_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mp_pos_config_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_mp_pos_config_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mp_pos_config_for_terminal"("p_organization_id" "uuid", "p_terminal_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_product_short_code"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_product_short_code"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_product_short_code"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" "uuid", "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_qty_in_base_units" numeric, "p_product_presentation_id" bigint, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" "uuid", "p_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" "uuid", "p_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" "uuid", "p_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" "uuid", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" "uuid", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" "uuid", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" "uuid", "p_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" "uuid", "p_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" "uuid", "p_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" "uuid", "p_product_id" bigint, "p_location_id" bigint, "p_stock_id" "uuid", "p_qty_in_base_units" numeric, "p_over_sell_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" "uuid", "p_product_id" bigint, "p_location_id" bigint, "p_stock_id" "uuid", "p_qty_in_base_units" numeric, "p_over_sell_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" "uuid", "p_product_id" bigint, "p_location_id" bigint, "p_stock_id" "uuid", "p_qty_in_base_units" numeric, "p_over_sell_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" "uuid", "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" "uuid", "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" "uuid", "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" "uuid", "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" "uuid", "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" "uuid", "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" "uuid", "p_new_qty" numeric, "p_prev_qty" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" "uuid", "p_new_qty" numeric, "p_prev_qty" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" "uuid", "p_new_qty" numeric, "p_prev_qty" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" "uuid", "p_qty_in_base_units" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" "uuid", "p_qty_in_base_units" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" "uuid", "p_qty_in_base_units" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_integration_credentials"("p_organization_id" "uuid", "p_provider" "text", "p_credentials" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_integration_credentials"("p_organization_id" "uuid", "p_provider" "text", "p_credentials" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_integration_credentials"("p_organization_id" "uuid", "p_provider" "text", "p_credentials" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_mp_pos_config"("p_organization_id" "uuid", "p_terminal_id" bigint, "p_location_id" bigint, "p_mp_pos_external_id" "text", "p_mp_store_id" "text", "p_mp_store_external_id" "text", "p_mp_pos_id" "text", "p_mp_qr_uuid" "text", "p_mp_qr_image_url" "text", "p_mp_point_device_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_mp_pos_config"("p_organization_id" "uuid", "p_terminal_id" bigint, "p_location_id" bigint, "p_mp_pos_external_id" "text", "p_mp_store_id" "text", "p_mp_store_external_id" "text", "p_mp_pos_id" "text", "p_mp_qr_uuid" "text", "p_mp_qr_image_url" "text", "p_mp_point_device_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_mp_pos_config"("p_organization_id" "uuid", "p_terminal_id" bigint, "p_location_id" bigint, "p_mp_pos_external_id" "text", "p_mp_store_id" "text", "p_mp_store_external_id" "text", "p_mp_pos_id" "text", "p_mp_qr_uuid" "text", "p_mp_qr_image_url" "text", "p_mp_point_device_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_rpc_schema_compatibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_rpc_schema_compatibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_rpc_schema_compatibility"() TO "service_role";


















GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."brands" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."brands" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."client_transactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."client_transactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."client_transactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."clients" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."clients" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."clients" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."disabled_prices" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."disabled_prices" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."disabled_prices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."disabled_prices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."disabled_prices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."disabled_prices_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enabled_prices_clients" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enabled_prices_clients" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enabled_prices_clients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."enabled_prices_clients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."enabled_prices_clients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."enabled_prices_clients_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_credentials" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_credentials" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_credentials" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_credentials_credential_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_credentials_credential_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_credentials_credential_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."iva" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."iva" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."iva" TO "service_role";



GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."load_orders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."load_orders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."load_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_movements" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_movements" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_stock" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_stock" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_containers_stock" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_traces" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_traces" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lot_traces" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lots" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lots" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mp_pos_config" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mp_pos_config" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mp_pos_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mp_pos_config_mp_pos_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mp_pos_config_mp_pos_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mp_pos_config_mp_pos_config_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."product_presentations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."product_presentations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."product_presentations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."prices" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."prices" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."products" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."products" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."providers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."providers" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."public_images" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."public_images" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."public_images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."purchasing_agents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."purchasing_agents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."purchasing_agents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock_movements" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock_movements" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stock_movements" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."store_order_sequences" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."store_order_sequences" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."store_order_sequences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sub_categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sub_categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sub_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminal_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminal_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminal_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminals" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."terminals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_order_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_order_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_orders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_orders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transfer_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformation_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformation_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformation_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."transformations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_preferences" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_preferences" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";































