-- ============================================================
-- MIGRATION: update_stock_waste
-- File: 02_update_stock_waste.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `stock` table migrated its primary key from bigint to uuid as part of
-- the offline-first sync initiative. This function records a waste (merma)
-- deduction from a specific stock row and must match the new PK type.
-- The function uses FOR UPDATE to serialize concurrent waste registrations
-- on the same stock row, preventing races between simultaneous waste ops.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_stock_id: bigint → uuid  (reason: stock PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   update_stock_waste(p_stock_id bigint, p_qty_in_base_units numeric) RETURNS void
--
-- NEW SIGNATURE:
--   update_stock_waste(p_stock_id uuid, p_qty_in_base_units numeric) RETURNS void
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.update_stock_waste(bigint, numeric);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.update_stock_waste(p_stock_id uuid, p_qty_in_base_units numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
