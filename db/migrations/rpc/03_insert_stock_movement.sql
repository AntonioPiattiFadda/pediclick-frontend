-- ============================================================
-- MIGRATION: insert_stock_movement
-- File: 03_insert_stock_movement.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- Both the `stock` and `stock_movements` tables migrated their primary keys
-- from bigint to uuid. The p_stock_id parameter and the returned
-- stock_movement_id must reflect the new uuid types. The internal variable
-- v_stock_movement_id is also updated. Catalog tables (lots,
-- product_presentations, locations) remain bigint.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [RETURNS] bigint → uuid  (reason: stock_movements PK migrated)
--   - [UUID] v_stock_movement_id: bigint → uuid  (local variable)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   insert_stock_movement(p_lot_id bigint, p_stock_id bigint, p_movement_type movement_type,
--     p_quantity numeric, p_qty_in_base_units numeric, p_product_presentation_id bigint,
--     p_from_location_id bigint, p_to_location_id bigint,
--     p_should_notify_owner boolean, p_created_by uuid) RETURNS bigint
--
-- NEW SIGNATURE:
--   insert_stock_movement(p_lot_id bigint, p_stock_id uuid, p_movement_type movement_type,
--     p_quantity numeric, p_qty_in_base_units numeric, p_product_presentation_id bigint,
--     p_from_location_id bigint, p_to_location_id bigint,
--     p_should_notify_owner boolean, p_created_by uuid) RETURNS uuid
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.insert_stock_movement(bigint, bigint, movement_type, numeric, numeric, bigint, bigint, bigint, boolean, uuid);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.insert_stock_movement(p_lot_id bigint, p_stock_id uuid, p_movement_type public.movement_type, p_quantity numeric, p_qty_in_base_units numeric, p_product_presentation_id bigint, p_from_location_id bigint, p_to_location_id bigint, p_should_notify_owner boolean, p_created_by uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
