-- ============================================================
-- MIGRATION: update_lot_sold_out_status
-- File: 08_update_lot_sold_out_status.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- This function checks whether all stock for a given lot has been depleted and
-- sets is_sold_out accordingly. A logic bug existed where the function would
-- only set is_sold_out = true when stock dropped to zero, but never reverted
-- is_sold_out back to false when stock was later added (e.g., after a load or
-- a transfer). The fix adds an explicit UPDATE to set is_sold_out = false when
-- total stock for the lot is > 0. No type changes: lots.lot_id remains bigint
-- (catalog table, not part of the uuid migration).
--
-- WHAT CHANGED (vs current schema.sql):
--   - [LOGIC FIX] Added UPDATE lots SET is_sold_out = false when v_total > 0;
--     previously only RAISE NOTICE was issued (never persisted to DB)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   update_lot_sold_out_status(p_lot_id bigint) RETURNS void
--
-- NEW SIGNATURE:
--   update_lot_sold_out_status(p_lot_id bigint) RETURNS void
--   (same signature; logic fix only)
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old signature (same types, just logic fix)
DROP FUNCTION IF EXISTS public.update_lot_sold_out_status(bigint);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.update_lot_sold_out_status(p_lot_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
