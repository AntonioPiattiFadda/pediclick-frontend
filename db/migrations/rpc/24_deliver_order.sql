-- ============================================================
-- MIGRATION: deliver_order
-- File: 24_deliver_order.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders` table migrated its primary key from bigint to uuid. The
-- p_order_id parameter must be updated accordingly. Two data-consistency bugs
-- were also fixed: (1) the JSONB passed to process_delivered_items_stock now
-- explicitly includes qty_in_base_units so the callee does not fall back to the
-- display quantity (which may use a different unit); (2) process_delivered_items_stock
-- is called even when v_items is null (i.e., all items were already in a non-PENDING
-- status) by passing an empty array, ensuring the order status transitions to DELIVERED
-- even in edge cases without silently skipping stock processing.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_order_id: bigint → uuid  (reason: orders PK migrated)
--   - [LOGIC FIX] qty_in_base_units now explicitly included in the JSONB passed
--     to process_delivered_items_stock to avoid unit inconsistency
--   - [LOGIC FIX] process_delivered_items_stock called with coalesce(v_items, '[]'::jsonb)
--     so null item sets do not silently skip stock processing
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   deliver_order(p_order_id bigint) RETURNS void
--
-- NEW SIGNATURE:
--   deliver_order(p_order_id uuid) RETURNS void
--
-- EXECUTION ORDER: Level 3 — Main function, calls process_delivered_items_stock (12)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.deliver_order(bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.deliver_order(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
