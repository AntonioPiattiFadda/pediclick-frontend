-- ============================================================
-- MIGRATION: create_simple_order
-- File: 26_create_simple_order.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders` and `clients` tables migrated their primary keys from bigint to
-- uuid. The p_client_id parameter must be updated to uuid since it is stored in
-- orders.client_id (which now references clients.client_id as uuid). The
-- function returns a full orders row, whose order_id column is also now uuid —
-- this is handled automatically by "RETURNS public.orders" since the orders
-- table definition was updated as part of the schema migration.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_client_id: bigint → uuid  (reason: clients PK migrated)
--   - [RETURNS] RETURNS public.orders now includes order_id as uuid
--     (automatic, since the orders table was migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   create_simple_order(p_organization_id uuid, p_location_id bigint,
--     p_client_id bigint) RETURNS public.orders
--
-- NEW SIGNATURE:
--   create_simple_order(p_organization_id uuid, p_location_id bigint,
--     p_client_id uuid) RETURNS public.orders
--
-- EXECUTION ORDER: Level 3 — Main function, calls generate_order_number (helper)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.create_simple_order(uuid, bigint, bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.create_simple_order(p_organization_id uuid, p_location_id bigint, p_client_id uuid) RETURNS public.orders
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
