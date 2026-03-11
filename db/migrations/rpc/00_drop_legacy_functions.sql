-- ============================================================
-- MIGRATION: (drop legacy functions)
-- File: 00_drop_legacy_functions.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- Before any RPC function is re-created with updated signatures, all legacy
-- versions must be removed to eliminate PostgreSQL overload ambiguity. These
-- functions either reference obsolete schema columns (business_owner_id,
-- current_quantity, store_id, stock_room_id, product_presentation_id in lots)
-- or have been replaced by newer, simpler implementations.
-- Running this file FIRST guarantees a clean slate for all subsequent migration
-- files and prevents "ambiguous function call" errors at runtime.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [DROP] transfer_stock — used current_quantity and store_id/stock_room_id columns (removed)
--   - [DROP] stock_to_transfer_item(stock_type,bigint,bigint,numeric,bigint,bigint) — old 6-param with store_id
--   - [DROP] create_order — replaced by register_order
--   - [DROP] create_load_order_with_lots_and_prices — used current_quantity, bulk_quantity_equivalence in lots
--   - [DROP] apply_transformation_stock(boolean,bigint,numeric,bigint,jsonb) — 4-param legacy with product_presentation_id in lots
--   - [DROP] reserve_stock_for_delivery(7-param) — old version with product_presentation_id param
--   - [DROP] get_last_over_sell_stock(3-param) — old version with product_presentation_id param
--   - [DROP] resolve_oversell_stock(4-param) — old version with product_presentation_id param
--   - [DROP] get_or_create_stock_with_location_pi_and_pi(3-param) — old version with product_presentation_id param
--   - [DROP] get_top_products_last_month — used o.business_owner_id (column removed from orders)
--   - [DROP] check_product_has_stock_by_short_code(bigint,uuid) — 2-param, used business_owner_id in products
--   - [DROP] check_product_has_stock_by_short_code(bigint,uuid,bigint) — 3-param overload, also obsolete
--   - [DROP] check_product_stock_by_short_code — used business_owner_id in products
--
-- OLD SIGNATURE: (various — all removed)
-- NEW SIGNATURE: (none — this file only drops functions)
--
-- EXECUTION ORDER: Level 0 — Must run before all other migration files
-- ============================================================

-- transfer_stock (any signature) — uses current_quantity, store_id, stock_room_id
DROP FUNCTION IF EXISTS public.transfer_stock CASCADE;

-- stock_to_transfer_item old version with store_id/stock_room_id
DROP FUNCTION IF EXISTS public.stock_to_transfer_item(stock_type, bigint, bigint, numeric, bigint, bigint);

-- create_order — legacy, replaced by register_order
DROP FUNCTION IF EXISTS public.create_order CASCADE;

-- create_load_order_with_lots_and_prices — uses current_quantity, bulk_quantity_equivalence in lots
DROP FUNCTION IF EXISTS public.create_load_order_with_lots_and_prices CASCADE;

-- apply_transformation_stock 4-param (old) — uses product_presentation_id in lots (eliminated)
DROP FUNCTION IF EXISTS public.apply_transformation_stock(boolean, bigint, numeric, bigint, jsonb);

-- reserve_stock_for_delivery 7-param (old) — with product_presentation_id
DROP FUNCTION IF EXISTS public.reserve_stock_for_delivery(bigint, bigint, bigint, bigint, bigint, numeric, numeric);

-- get_last_over_sell_stock 3-param (old) — with product_presentation_id
DROP FUNCTION IF EXISTS public.get_last_over_sell_stock(bigint, bigint, bigint);

-- resolve_oversell_stock 4-param (old) — with product_presentation_id
DROP FUNCTION IF EXISTS public.resolve_oversell_stock(bigint, bigint, bigint, numeric);

-- get_or_create_stock_with_location_pi_and_pi 3-param (old) — with product_presentation_id
DROP FUNCTION IF EXISTS public.get_or_create_stock_with_location_pi_and_pi(bigint, bigint, bigint);

-- get_top_products_last_month — uses o.business_owner_id that does not exist in orders
DROP FUNCTION IF EXISTS public.get_top_products_last_month CASCADE;

-- check_product_has_stock_by_short_code old 2-param — uses business_owner_id in products
DROP FUNCTION IF EXISTS public.check_product_has_stock_by_short_code(bigint, uuid);

-- check_product_has_stock_by_short_code old 3-param overload — also obsolete, references removed columns
DROP FUNCTION IF EXISTS public.check_product_has_stock_by_short_code(bigint, uuid, bigint);

-- check_product_stock_by_short_code — uses business_owner_id in products
DROP FUNCTION IF EXISTS public.check_product_stock_by_short_code CASCADE;
