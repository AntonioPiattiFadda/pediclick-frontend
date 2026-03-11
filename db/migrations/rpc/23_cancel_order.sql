-- ============================================================
-- MIGRATION: cancel_order
-- File: 23_cancel_order.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders`, `order_items`, and `stock` tables all migrated their primary
-- keys from bigint to uuid. Internal variables v_order_id and v_stock_id and
-- the JSONB casts for order_id and client_id must be updated to uuid. A logic
-- fix was also applied: before restoring stock when cancelling an order, the
-- function now checks whether the associated lot has is_sold_out = true
-- (equivalent to "is_closed" in the spec) and skips restoration if so,
-- preventing incorrect stock increases on already-closed lots.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_order_id: bigint → uuid  (reason: orders PK migrated)
--   - [UUID] v_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] RETURNS TABLE(order_id): bigint → uuid
--   - [LOGIC FIX] Added check on is_sold_out before restoring stock;
--     stock is not restored if the lot is already marked sold out / closed
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   cancel_order(p_order jsonb, p_order_items jsonb,
--     p_notification jsonb) RETURNS TABLE(order_id bigint)
--
-- NEW SIGNATURE:
--   cancel_order(p_order jsonb, p_order_items jsonb,
--     p_notification jsonb) RETURNS TABLE(order_id uuid)
--
-- EXECUTION ORDER: Level 3 — Main function, calls update_lot_sold_out_status (08)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.cancel_order(jsonb, jsonb, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.cancel_order(p_order jsonb, p_order_items jsonb, p_notification jsonb) RETURNS TABLE(order_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
