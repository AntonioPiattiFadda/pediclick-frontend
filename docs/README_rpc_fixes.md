# RPC Fixes — Pediclick

Documento de referencia para actualizar todas las funciones RPC de Supabase.
Combina: correcciones de lógica + migración bigint → UUID (local-first sync).

---

## Contexto

### Migración UUID
Las siguientes 8 tablas operativas migraron su PK de `bigint` a `UUID DEFAULT gen_random_uuid()` para soportar creación offline sin colisiones:

| Tabla | PK anterior | PK nueva |
|---|---|---|
| `clients` | `client_id bigint` | `client_id uuid` |
| `terminal_sessions` | `terminal_session_id bigint` | `terminal_session_id uuid` |
| `orders` | `order_id bigint` | `order_id uuid` |
| `stock` | `stock_id bigint` | `stock_id uuid` |
| `order_items` | `order_item_id bigint` | `order_item_id uuid` |
| `payments` | `payment_id bigint` | `payment_id uuid` |
| `client_transactions` | `transaction_id bigint` | `transaction_id uuid` |
| `stock_movements` | `stock_movement_id bigint` | `stock_movement_id uuid` |

**Tablas que se mantienen en bigint:** todo el catálogo/config (`products`, `lots`, `locations`, `prices`, `providers`, etc.).

---

## Reglas generales al reescribir funciones

1. Todo parámetro o variable que referencie una PK/FK de las 8 tablas migradas debe cambiar de `bigint` a `uuid`.
2. Los casts desde JSONB cambian de `::bigint` a `::uuid`. Ejemplo: `(p_order->>'order_id')::uuid`.
3. Las funciones que retornan un ID de esas tablas cambian su `RETURNS bigint` a `RETURNS uuid`.
4. `lot_id`, `product_id`, `location_id` y demás IDs de catálogo se mantienen `bigint`.
5. Antes de reescribir, verificar que no exista una versión legacy de la función con firma diferente — si existe, eliminarla primero.

---

## Funciones a ELIMINAR (legacy — no actualizar)

Eliminar antes de hacer cualquier otro cambio para evitar ambigüedad de overloads.

| Función | Motivo |
|---|---|
| `transfer_stock` | Usa `current_quantity`, `store_id`, `stock_room_id` — columnas inexistentes |
| `stock_to_transfer_item(stock_type, bigint, bigint, numeric, bigint, bigint)` | Versión vieja con `store_id`/`stock_room_id` |
| `create_order` | Legacy — reemplazada por `register_order` |
| `create_load_order_with_lots_and_prices` | Usa `current_quantity`, `bulk_quantity_equivalence` en lots — schema incompatible |
| `apply_transformation_stock(boolean, bigint, numeric, bigint, jsonb)` | Versión vieja 4 params — usa `product_presentation_id` en lots eliminado |
| `reserve_stock_for_delivery(bigint, bigint, bigint, bigint, bigint, numeric, numeric)` | Versión vieja 7 params con `product_presentation_id` |
| `get_last_over_sell_stock(bigint, bigint, bigint)` | Versión vieja 3 params con `product_presentation_id` |
| `resolve_oversell_stock(bigint, bigint, bigint, numeric)` | Versión vieja 4 params con `product_presentation_id` |
| `get_or_create_stock_with_location_pi_and_pi(bigint, bigint, bigint)` | Versión vieja 3 params con `product_presentation_id` |
| `get_top_products_last_month` | Usa `o.business_owner_id` que no existe en `orders` |
| `check_product_has_stock_by_short_code` | Usa `business_owner_id` en `products` que no existe |
| `check_product_stock_by_short_code` | Mismo caso |

---

## Orden de ejecución recomendado

Respetar este orden para no romper dependencias entre funciones:

```
Nivel 1 — Auxiliares base (no dependen de otras RPCs)
  subtract_stock_quantity
  update_stock_waste
  insert_stock_movement
  apply_client_credit_adjustment
  get_or_create_stock_with_location_pi_and_pi
  resolve_oversell_stock
  get_last_over_sell_stock
  update_lot_sold_out_status

Nivel 2 — Auxiliares compuestas (llaman a nivel 1)
  create_stock_movement_waste
  assign_stock_to_location
  reserve_stock_for_delivery
  process_delivered_items_stock
  compensate_over_sell_lots
  stock_from_transfer_item
  stock_to_transfer_item
  update_stock_from_transfer_item

Nivel 3 — Funciones principales (llaman a nivel 1 y 2)
  register_order_header
  register_order_items
  register_order_payments
  register_payments
  register_client_payments
  register_order
  cancel_order
  deliver_order
  delete_delivery_order_item
  create_simple_order

Nivel 4 — Transformaciones y transferencias
  apply_transformation_stock
  transformation_items
  add_stock
  update_transfer_order_items
  transfer_order_items
```

---

## Tabla completa de fixes

| # | Función | Problema de lógica | Gravedad | Prioridad | Impacto UUID | Cambios UUID requeridos |
|---|---------|-------------------|----------|-----------|--------------|------------------------|
| 1 | `register_order_items` | Race condition: resta stock y verifica negativo DESPUÉS del UPDATE | 🔴 Crítica | P1 | ✅ Sí | `p_order_id`, `v_stock_id`, `v_order_item_id` → `uuid` |
| 2 | `process_delivered_items_stock` | Reserved desincronizado si hay retry parcial | 🔴 Crítica | P1 | ✅ Sí | `v_stock_id` → `uuid`; `stock_id` en JSONB input → `uuid` |
| 3 | `apply_transformation_stock` (5 params) | — | — | — | ✅ Sí | `p_origin_stock_id`, `p_stock_id` → `uuid` |
| 4 | `get_or_create_stock_with_location_pi_and_pi` (2 params) | Race condition: sin `FOR UPDATE` ni `ON CONFLICT` al crear stock | 🔴 Crítica | P1 | ✅ Sí | Retorna `uuid`; `v_stock_id` → `uuid` |
| 5 | `compensate_over_sell_lots` | `quantity = null` en JSONB no tiene coalesce — explota silenciosamente | 🟠 Alta | P2 | ✅ Sí | `v_last_stock_id` → `uuid` |
| 6 | `reserve_stock_for_delivery` (6 params) | Sin validación de stock disponible antes de reservar | 🟠 Alta | P2 | ✅ Sí | `p_order_item_id`, `p_stock_id`, `v_stock_id` → `uuid` |
| 7 | `deliver_order` | Si todos los items están en otro status, queda DELIVERED sin procesar stock | 🟠 Alta | P2 | ✅ Sí | `p_order_id` → `uuid` |
| 8 | `cancel_order` | Restaura stock sin verificar `is_closed` del lote | 🟡 Media | P2 | ✅ Sí | `v_order_id`, `v_stock_id` → `uuid` |
| 9 | `delete_delivery_order_item` | Usa `quantity` en vez de `qty_in_base_units` para descontar reserved — inconsistencia de unidades | 🟠 Alta | P2 | ✅ Sí | `p_order_item_id`, `p_stock_id` → `uuid` |
| 10 | `register_order` | — | — | — | ✅ Sí | `v_order_id` → `uuid`; RETURNS `order_id uuid` |
| 11 | `register_order_header` | — | — | — | ✅ Sí | cast `order_id` → `::uuid`; retorna `uuid` |
| 12 | `register_order_payments` | Código duplicado con `register_payments` — fix en ambas | 🟡 Media | P3 | ✅ Sí | `p_order_id`, `v_client_id`, `v_terminal_session_id` → `uuid` |
| 13 | `register_payments` | Código duplicado con `register_order_payments` | 🟡 Media | P3 | ✅ Sí | `p_order_id`, `v_client_id` → `uuid` |
| 14 | `register_client_payments` | — | — | — | ✅ Sí | `p_client_id` → `uuid` |
| 15 | `apply_client_credit_adjustment` | — | — | — | ✅ Sí | `p_client_id` → `uuid` |
| 16 | `assign_stock_to_location` | — | — | — | ✅ Sí | `v_from_stock_id`, `v_stock_movement_id` → `uuid` |
| 17 | `create_stock_movement_waste` | — | — | — | ✅ Sí | `p_stock_id` → `uuid`; `stock_movement_id` en retorno → `uuid` |
| 18 | `insert_stock_movement` | — | — | — | ✅ Sí | `p_stock_id` → `uuid`; retorna `uuid` |
| 19 | `update_stock_waste` | — | — | — | ✅ Sí | `p_stock_id` → `uuid` |
| 20 | `subtract_stock_quantity` | — | — | — | ✅ Sí | `p_stock_id` → `uuid` |
| 21 | `create_simple_order` | — | — | — | ✅ Sí | `p_client_id` → `uuid`; retorna `order_id uuid` |
| 22 | `get_last_over_sell_stock` (2 params) | — | — | — | ✅ Sí | `stock_id` en resultado → `uuid` |
| 23 | `resolve_oversell_stock` (3 params) | — | — | — | ✅ Sí | `v_stock_id` → `uuid`; JSONB resultado con `uuid` |
| 24 | `update_transfer_order_items` | — | — | — | ✅ Sí | `v_prev_stock_id` → `uuid` |
| 25 | `stock_from_transfer_item` | — | — | — | ✅ Sí | `p_stock_id` → `uuid` |
| 26 | `stock_to_transfer_item` (nueva, con `p_location_id`) | — | — | — | ✅ Sí | `p_stock_id` interno → `uuid` |
| 27 | `update_stock_from_transfer_item` | — | — | — | ✅ Sí | `p_stock_id` → `uuid` |
| 28 | `transformation_items` | No valida que suma destino ≤ cantidad origen | 🟡 Media | P3 | ✅ Sí | `v_final_stock_id` → `uuid` |
| 29 | `update_lot_sold_out_status` | Nunca revierte `is_sold_out = false` al cancelar/restaurar stock | 🟡 Media | P3 | ➖ Sin impacto | — |
| 30 | `add_stock` | `CREATE TEMP TABLE ... ON COMMIT DROP` falla con PgBouncer transaction pooling | 🟡 Media | P3 | ➖ Sin impacto | — |
| 31 | `get_lot_lineage` / `get_lot_universe` | Recursión sin límite de profundidad — loop infinito con ciclos en `lot_traces` | 🟡 Media | P4 | ➖ Sin impacto | — |
| 32 | Todas las funciones de stock | Sin `organization_id` en filtros de `stock`/`lots` — riesgo multi-tenant | 🔴 Crítica | P1 | ➖ Sin impacto | — |
| 33 | `resolve_oversell_stock` (2 params) | El `SELECT lot_id` busca el lote más reciente del producto sin filtrar por `location_id` — puede asociar el oversell a un lote de otra ubicación | 🟠 Alta | P2 | ✅ Sí | `v_stock_id` → `uuid`; retorno `uuid` |
| 34 | `deliver_order` → `process_delivered_items_stock` | `deliver_order` construye el jsonb con clave `'quantity'` (no `'qty_in_base_units'`), por lo que `process_delivered_items_stock` **siempre** usa el fallback a unidades de presentación en vez de base units | 🟠 Alta | P2 | ✅ Sí | `p_order_id` → `uuid` (ya en row #7, este es el mecanismo exacto) |

---

## Detalle por función — Cambios específicos

### `subtract_stock_quantity`
```sql
-- ANTES
CREATE OR REPLACE FUNCTION subtract_stock_quantity(p_stock_id bigint, ...)

-- DESPUÉS
CREATE OR REPLACE FUNCTION subtract_stock_quantity(p_stock_id uuid, ...)
```

### `update_stock_waste`
```sql
-- ANTES
CREATE OR REPLACE FUNCTION update_stock_waste(p_stock_id bigint, ...)

-- DESPUÉS
CREATE OR REPLACE FUNCTION update_stock_waste(p_stock_id uuid, ...)
```

### `insert_stock_movement`
```sql
-- ANTES
CREATE OR REPLACE FUNCTION insert_stock_movement(p_stock_id bigint, ...) RETURNS bigint

-- DESPUÉS
CREATE OR REPLACE FUNCTION insert_stock_movement(p_stock_id uuid, ...) RETURNS uuid
```

### `apply_client_credit_adjustment`
```sql
-- ANTES
CREATE OR REPLACE FUNCTION apply_client_credit_adjustment(p_client_id bigint, ...)

-- DESPUÉS
CREATE OR REPLACE FUNCTION apply_client_credit_adjustment(p_client_id uuid, ...)
```

### `get_or_create_stock_with_location_pi_and_pi` (2 params)
```sql
-- ANTES (schema actual — sin protección de concurrencia):
select s.stock_id into v_stock_id from stock s join lots l on l.lot_id = s.lot_id
where l.product_id = p_product_id and s.location_id = p_location_id
order by l.created_at desc limit 1;
-- Sin FOR UPDATE → dos transacciones simultáneas pueden ambas ver v_stock_id = null
-- y ambas insertar un lote+stock duplicado.
RETURNS bigint

-- DESPUÉS:
CREATE OR REPLACE FUNCTION get_or_create_stock_with_location_pi_and_pi(p_product_id bigint, p_location_id bigint) RETURNS uuid
-- + agregar FOR UPDATE al SELECT de stock existente para evitar race condition
-- + usar INSERT ... ON CONFLICT DO NOTHING con UNIQUE constraint en (lot_id, location_id)
--   o manejar la excepción de duplicate key para reintentar el SELECT
```

### `register_order_header`
```sql
-- ANTES
v_order_id := (p_order->>'order_id')::bigint;
RETURNS bigint

-- DESPUÉS
v_order_id := (p_order->>'order_id')::uuid;
RETURNS uuid
```

### `register_order`
```sql
-- ANTES
v_order_id bigint;
RETURNS TABLE(order_id bigint)

-- DESPUÉS
v_order_id uuid;
RETURNS TABLE(order_id uuid)
```

### `register_order_items`
```sql
-- ANTES
p_order_id bigint
v_stock_id bigint
v_order_item_id bigint

-- DESPUÉS
p_order_id uuid
v_stock_id uuid
v_order_item_id uuid
-- + FIX lógica: agregar FOR UPDATE al UPDATE de stock para evitar race condition
-- + verificar negativos ANTES con SELECT ... FOR UPDATE
```

### `register_order_payments` y `register_payments`
```sql
-- ANTES
p_order_id bigint
v_client_id bigint
v_terminal_session_id bigint

-- DESPUÉS
p_order_id uuid
v_client_id uuid
v_terminal_session_id uuid
```

### `register_client_payments`
```sql
-- ANTES
p_client_id bigint

-- DESPUÉS
p_client_id uuid
```

### `cancel_order`
```sql
-- ANTES
v_order_id bigint
v_stock_id bigint

-- DESPUÉS
v_order_id uuid
v_stock_id uuid
-- + FIX lógica: verificar is_closed antes de restaurar stock
```

### `deliver_order`
```sql
-- ANTES
p_order_id bigint
-- Construye jsonb para process_delivered_items_stock con clave 'quantity':
jsonb_build_object('order_item_id', oi.order_item_id, 'stock_id', oi.stock_id,
                   'quantity', oi.quantity, 'over_sell_quantity', oi.over_sell_quantity)

-- DESPUÉS
p_order_id uuid
-- FIX: pasar 'qty_in_base_units' explícitamente para evitar fallback a unidades de presentación:
jsonb_build_object('order_item_id', oi.order_item_id, 'stock_id', oi.stock_id,
                   'qty_in_base_units', oi.qty_in_base_units,
                   'quantity', oi.quantity, 'over_sell_quantity', oi.over_sell_quantity)
-- + FIX lógica: procesar stock aunque v_items sea null (items en otro status)
```

### `delete_delivery_order_item`
```sql
-- ANTES
p_order_item_id bigint
p_stock_id bigint
-- usa: v_quantity + v_over_sell_quantity (inconsistencia de unidades)

-- DESPUÉS
p_order_item_id uuid
p_stock_id uuid
-- FIX: usar qty_in_base_units en lugar de quantity para calcular v_total_reserved
```

### `reserve_stock_for_delivery` (6 params)
```sql
-- ANTES
p_order_item_id bigint
p_stock_id bigint
v_stock_id bigint

-- DESPUÉS
p_order_item_id uuid
p_stock_id uuid
v_stock_id uuid
-- + FIX lógica: validar que stock disponible >= total a reservar
```

### `process_delivered_items_stock`
```sql
-- ANTES
v_stock_id bigint

-- DESPUÉS
v_stock_id uuid
-- + FIX lógica: usar FOR UPDATE al leer stock para evitar desincronización en retry
```

### `compensate_over_sell_lots`
```sql
-- ANTES
v_last_stock_id bigint

-- DESPUÉS
v_last_stock_id uuid
-- + FIX lógica: agregar coalesce(..., 0) a todos los campos quantity del JSONB
```

### `assign_stock_to_location`
```sql
-- NOTA: ya tiene FOR UPDATE en el stock origen y destino — no requiere fix de concurrencia.
-- El schema actual ya hace:
--   select * into v_stock from stock where stock_id = v_from_stock_id for update;
--   select * into v_to_stock from stock where ... for update;
-- Solo requiere cambio UUID en variables internas:

-- ANTES
v_from_stock_id bigint   -- extraído de p_from_stock_data->>'stock_id'
v_stock_movement_id bigint

-- DESPUÉS
v_from_stock_id uuid
v_stock_movement_id uuid
```

### `create_stock_movement_waste`
```sql
-- ANTES
p_stock_id bigint

-- DESPUÉS
p_stock_id uuid
```

### `create_simple_order`
```sql
-- ANTES
p_client_id bigint
RETURNS orders (con order_id bigint)

-- DESPUÉS
p_client_id uuid
RETURNS orders (con order_id uuid)
```

### `apply_transformation_stock` (5 params)
```sql
-- ANTES
p_origin_stock_id bigint
p_stock_id bigint

-- DESPUÉS
p_origin_stock_id uuid
p_stock_id uuid
```

### `transformation_items`
```sql
-- ANTES
v_final_stock_id bigint

-- DESPUÉS
v_final_stock_id uuid
-- + FIX lógica: validar sum(quantity destino) <= quantity origen antes de procesar
```

### `resolve_oversell_stock` (3 params — 2 params sin `product_presentation_id`)
```sql
-- ANTES (2-param overload): selección de lote sin filtrar por location
select l.lot_id from lots l
where l.product_id = p_product_id
order by l.created_at desc
limit 1;
-- PROBLEMA: puede elegir el lote más reciente del producto aunque sea de otra ubicación.
-- Si ese lote no tiene stock en p_location_id, crea un stock row bajo un lote incorrecto.

-- DESPUÉS: buscar lote que YA tenga stock en la location, o crear uno nuevo:
select l.lot_id
into v_lot_id
from stock s
join lots l on l.lot_id = s.lot_id
where l.product_id = p_product_id
  and s.location_id = p_location_id
order by l.created_at desc
limit 1;
-- Si es null, crear lote nuevo (sin herencia de lotes de otras ubicaciones)

-- Cambio UUID:
-- v_stock_id bigint → uuid
-- retorno: jsonb_build_object incluye stock_id como uuid
```

### `update_transfer_order_items`
```sql
-- ANTES
v_prev_stock_id bigint

-- DESPUÉS
v_prev_stock_id uuid
```

### `stock_from_transfer_item`
```sql
-- ANTES
p_stock_id bigint

-- DESPUÉS
p_stock_id uuid
```

### `stock_to_transfer_item` (con p_location_id)
```sql
-- ANTES
-- variable interna v_stock_id bigint

-- DESPUÉS
-- variable interna v_stock_id uuid
```

### `update_stock_from_transfer_item`
```sql
-- ANTES
p_stock_id bigint

-- DESPUÉS
p_stock_id uuid
```

### `add_stock`
```sql
-- PROBLEMA: CREATE TEMP TABLE ... ON COMMIT DROP falla con PgBouncer en transaction pooling mode
-- ANTES (problemático con PgBouncer):
create temp table tmp_lc on commit drop as
  select (lc->>'lot_container_id')::bigint as lot_container_id, ...
  from jsonb_array_elements(v_lc_checked) lc;

insert into lot_containers_stock (...)
select ... from tmp_lc lc;

drop table tmp_lc;

-- DESPUÉS (reemplazar con CTE — compatible con PgBouncer):
with tmp_lc as (
  select
    (lc->>'lot_container_id')::bigint      as lot_container_id,
    nullif(lc->>'location_id', '')::bigint as location_id,
    (lc->>'quantity')::numeric             as quantity,
    nullif(lc->>'client_id', '')::uuid     as client_id,   -- uuid tras migración
    nullif(lc->>'provider_id', '')::bigint as provider_id
  from jsonb_array_elements(v_lc_checked) lc
)
insert into lot_containers_stock (organization_id, stock_id, lot_container_id,
                                   quantity, created_at, location_id, client_id, provider_id)
select p_organization_id,
       (select s.stock_id from stock s
        where s.lot_id = v_lot_id
          and coalesce(s.location_id, -1) = coalesce(lc.location_id, -1)
        limit 1),
       lc.lot_container_id, lc.quantity, now(), lc.location_id, lc.client_id, lc.provider_id
from tmp_lc lc;
-- Nota: stock_id en lot_containers_stock es uuid tras migración de stock
```

### `update_lot_sold_out_status`
```sql
-- FIX lógica: agregar rama ELSE que revierta is_sold_out = false
-- cuando v_total > 0 (actualmente solo loggea con RAISE NOTICE)
update lots set is_sold_out = false where lot_id = p_lot_id and v_total > 0;
```

### `get_lot_lineage` / `get_lot_universe`
```sql
-- PROBLEMA: CTEs recursivas sin límite de profundidad — loop infinito si hay ciclos en lot_traces
-- ANTES (get_lot_universe — vulnerable a ciclos):
with recursive down_tree as (
    select lt.lot_to_id as lot_id from lot_traces lt where lt.lot_from_id = p_lot_id
    union all
    select lt.lot_to_id from lot_traces lt join down_tree d on lt.lot_from_id = d.lot_id
), ...

-- DESPUÉS (PostgreSQL 14+ / Supabase — CYCLE clause nativa):
with recursive down_tree as (
    select lt.lot_to_id as lot_id from lot_traces lt where lt.lot_from_id = p_lot_id
    union all
    select lt.lot_to_id from lot_traces lt join down_tree d on lt.lot_from_id = d.lot_id
)
CYCLE lot_id SET is_cycle TO true DEFAULT false USING cycle_path

-- Luego filtrar: select lot_id from down_tree where not is_cycle
-- Aplica el mismo patrón a up_tree y a get_lot_lineage/get_lot_ancestors/get_lot_descendants
```

---

## Frontend — TypeScript

Cambiar `number` → `string` en interfaces/tipos para:
- `order_id`, `order_item_id` 
- `client_id`
- `stock_id`, `stock_movement_id`
- `payment_id`, `transaction_id`
- `terminal_session_id`

Cambiar casts en llamadas Supabase:
```ts
// ANTES
.eq('order_id', orderId) // orderId: number

// DESPUÉS  
.eq('order_id', orderId) // orderId: string (uuid)
```

---

## Validación post-migración

Ejecutar en Supabase SQL Editor para verificar que no quedaron funciones con columnas obsoletas:

```sql
SELECT * FROM validate_rpc_schema_compatibility();
```

Resultado esperado: 0 rows (o solo falsos positivos conocidos documentados arriba).
