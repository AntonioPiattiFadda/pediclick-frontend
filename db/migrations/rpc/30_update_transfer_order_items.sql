-- ============================================================
-- MIGRATION: update_transfer_order_items
-- File: 30_update_transfer_order_items.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid. The internal
-- variable v_prev_stock_id (looked up from transfer_order_items.stock_id, which
-- references the migrated stock table) must be updated to uuid. The stock_id
-- values in the JSONB input p_items are also now uuid strings, so the ::uuid
-- casts already present in the function body are correct. No logic changes
-- were needed beyond the variable type update.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_prev_stock_id: bigint → uuid  (reason: stock PK migrated;
--     read from transfer_order_items.stock_id which references stock.stock_id)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   update_transfer_order_items(p_transfer_order_id bigint,
--     p_items jsonb) RETURNS jsonb
--
-- NEW SIGNATURE:
--   update_transfer_order_items(p_transfer_order_id bigint,
--     p_items jsonb) RETURNS jsonb
--   (same external signature; internal variable type updated)
--
-- EXECUTION ORDER: Level 4 — Transformation/transfer, calls
--   update_stock_from_transfer_item (16), update_lot_containers_movements (helper)
-- ============================================================

-- 1. Drop old signature (same params, internal vars change)
DROP FUNCTION IF EXISTS public.update_transfer_order_items(bigint, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.update_transfer_order_items(p_transfer_order_id bigint, p_items jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
