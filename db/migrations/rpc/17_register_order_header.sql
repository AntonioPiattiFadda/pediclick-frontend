-- ============================================================
-- MIGRATION: register_order_header
-- File: 17_register_order_header.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders` and `clients` tables migrated their primary keys from bigint to
-- uuid. This function updates an existing order's header fields and returns the
-- order_id. The JSONB order_id must now be cast to ::uuid (was ::bigint), and
-- the returned uuid replaces the old bigint return. Internal v_order_id and
-- v_client_id variables are updated accordingly.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] v_order_id: bigint → uuid  (read from p_order->>'order_id' as ::uuid)
--   - [UUID] v_client_id: bigint → uuid  (reason: clients PK migrated)
--   - [RETURNS] bigint → uuid  (reason: orders PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   register_order_header(p_order jsonb) RETURNS bigint
--
-- NEW SIGNATURE:
--   register_order_header(p_order jsonb) RETURNS uuid
--
-- EXECUTION ORDER: Level 3 — Main function, no calls to other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.register_order_header(jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.register_order_header(p_order jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
