
-- 1. Drop old versions
DROP FUNCTION IF EXISTS public.get_lot_lineage(bigint);
DROP FUNCTION IF EXISTS public.get_lot_universe(bigint);
DROP FUNCTION IF EXISTS public.get_lot_ancestors(bigint);
DROP FUNCTION IF EXISTS public.get_lot_descendants(bigint);
-- Nop estan mas en uso