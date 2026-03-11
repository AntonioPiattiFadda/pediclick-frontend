-- ============================================================
-- MIGRATION: create_stock_movement_waste
-- File: 09_create_stock_movement_waste.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` and `stock_movements` tables migrated their primary keys from
-- bigint to uuid. This composite function orchestrates a waste (merma)
-- operation by calling update_stock_waste and insert_stock_movement; both
-- callee functions now expect uuid stock IDs, so the p_stock_id parameter
-- here must also become uuid. The returned JSONB includes the stock_movement_id
-- which is now also a uuid.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [UUID] v_stock_movement_id: bigint → uuid  (reason: stock_movements PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   create_stock_movement_waste(p_lot_id bigint, p_stock_id bigint,
--     p_movement_type movement_type, p_quantity numeric,
--     p_qty_in_base_units numeric, p_product_presentation_id bigint,
--     p_from_location_id bigint, p_to_location_id bigint,
--     p_should_notify_owner boolean, p_created_by uuid) RETURNS jsonb
--
-- NEW SIGNATURE:
--   create_stock_movement_waste(p_lot_id bigint, p_stock_id uuid,
--     p_movement_type movement_type, p_quantity numeric,
--     p_qty_in_base_units numeric, p_product_presentation_id bigint,
--     p_from_location_id bigint, p_to_location_id bigint,
--     p_should_notify_owner boolean, p_created_by uuid) RETURNS jsonb
--
-- EXECUTION ORDER: Level 2 — Composite auxiliary, calls update_stock_waste (02)
--   and insert_stock_movement (03)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.create_stock_movement_waste(bigint, bigint, movement_type, numeric, numeric, bigint, bigint, bigint, boolean, uuid);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.create_stock_movement_waste(p_lot_id bigint, p_stock_id uuid, p_movement_type public.movement_type, p_quantity numeric, p_qty_in_base_units numeric, p_product_presentation_id bigint, p_from_location_id bigint, p_to_location_id bigint, p_should_notify_owner boolean, p_created_by uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
