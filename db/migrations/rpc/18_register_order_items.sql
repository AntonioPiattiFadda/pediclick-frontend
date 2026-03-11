-- ============================================================
-- MIGRATION: register_order_items
-- File: 18_register_order_items.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders`, `order_items`, and `stock` tables all migrated their primary
-- keys from bigint to uuid. The p_order_id parameter and internal variables
-- v_stock_id and v_order_item_id are updated accordingly. A race condition was
-- also fixed: the original code updated stock quantity directly without first
-- reading and locking the current value; a concurrent order could pass the
-- availability check simultaneously, both decrement stock, and produce a
-- negative balance. The fix adds a SELECT FOR UPDATE before the UPDATE to
-- serialize concurrent stock deductions and validate the current quantity
-- against the required amount before committing the change.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_order_id: bigint → uuid  (reason: orders PK migrated)
--   - [UUID] v_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_order_item_id: bigint → uuid  (reason: order_items PK migrated)
--   - [LOGIC FIX] SELECT FOR UPDATE added before stock UPDATE to check negatives
--     first and prevent race condition between concurrent order registrations
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   register_order_items(p_order_id bigint, p_items jsonb) RETURNS void
--
-- NEW SIGNATURE:
--   register_order_items(p_order_id uuid, p_items jsonb) RETURNS void
--
-- EXECUTION ORDER: Level 3 — Main function, calls reserve_stock_for_delivery (11),
--   resolve_oversell_stock (06), update_lot_sold_out_status (08)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.register_order_items(bigint, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.register_order_items(p_order_id uuid, p_items jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
