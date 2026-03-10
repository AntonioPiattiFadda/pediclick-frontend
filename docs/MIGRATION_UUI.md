# Migración PKs bigint → UUID (Local-First Sync)

## Objetivo

Migrar las primary keys de 8 tablas operativas de `bigint` a `UUID` para evitar colisiones de IDs cuando múltiples terminales crean registros offline simultáneamente.

## Tablas que migran a UUID PK

| Tabla | PK | Nueva PK |
|---|---|---|
| `clients` | `client_id bigint` | `client_id UUID DEFAULT gen_random_uuid()` |
| `terminal_sessions` | `terminal_session_id bigint` | `terminal_session_id UUID DEFAULT gen_random_uuid()` |
| `orders` | `order_id bigint` | `order_id UUID DEFAULT gen_random_uuid()` |
| `stock` | `stock_id bigint` | `stock_id UUID DEFAULT gen_random_uuid()` |
| `order_items` | `order_item_id bigint` | `order_item_id UUID DEFAULT gen_random_uuid()` |
| `payments` | `payment_id bigint` | `payment_id UUID DEFAULT gen_random_uuid()` |
| `client_transactions` | `transaction_id bigint` | `transaction_id UUID DEFAULT gen_random_uuid()` |
| `stock_movements` | `stock_movement_id bigint` | `stock_movement_id UUID DEFAULT gen_random_uuid()` |

## Tablas que se mantienen en bigint

Todas las de catálogo/config (siempre se crean online, sin riesgo de colisión): `products`, `product_presentations`, `prices`, `providers`, `categories`, `sub_categories`, `brands`, `locations`, `terminals`, `lots`, `load_orders`, `iva`, `public_images`, `purchasing_agents`, `store_order_sequences`, `lot_containers`, `lot_containers_stock`, `lot_containers_movements`, `lot_traces`, `transfer_orders`, `transfer_order_items`, `transformations`, `transformation_items`, `notifications`, `disabled_prices`, `enabled_prices_clients`. `organizations` y `users` ya usan UUID.

## FKs que cambian de bigint a UUID

Estas columnas en tablas hijas deben cambiar su tipo para matchear la nueva PK UUID de la tabla padre:

**FK a `clients`:**
- `orders.client_id`
- `payments.client_id`
- `client_transactions.client_id`
- `enabled_prices_clients.client_id`
- `lot_containers_stock.client_id`
- `lot_containers_movements.from_client_id`
- `lot_containers_movements.to_client_id`

**FK a `terminal_sessions`:**
- `orders.terminal_session_id`
- `payments.terminal_session_id`

**FK a `orders`:**
- `order_items.order_id`
- `payments.order_id`
- `client_transactions.order_id`
- `notifications.order_id`

**FK a `stock`:**
- `order_items.stock_id`
- `stock_movements.stock_id`
- `lot_containers_stock.stock_id`
- `transfer_order_items.stock_id`
- `transformation_items.stock_id`

## RPCs a actualizar (cambiar bigint → uuid en parámetros y variables internas)

1. `create_simple_order` — `p_client_id`
2. `register_order` — usa `order_id` internamente
3. `register_order_header` — cast de `p_order->>'order_id'` a uuid
4. `register_order_items` — `p_order_id`
5. `register_order_payments` — `p_order_id`
6. `register_payments` — `p_order_id`
7. `cancel_order` — `v_order_id`
8. `register_client_payments` — `p_client_id`
9. `apply_client_credit_adjustment` — `p_client_id`
10. `assign_stock_to_location` — `v_from_stock_id`
11. `create_stock_movement_waste` — `p_stock_id`
12. `insert_stock_movement` — `p_stock_id`
13. `update_stock_waste` — `p_stock_id`
14. `subtract_stock_quantity` — refs a stock_id
15. `get_or_create_stock_with_location_pi_and_pi` — retorna uuid en vez de bigint

## Frontend — Cambios TypeScript

Actualizar todos los tipos/interfaces donde se use `number` para IDs de las 8 tablas migradas → cambiar a `string`.

Actualizar todas las llamadas a Supabase `.eq('order_id', ...)`, `.eq('client_id', ...)`, etc. donde se pase un `number` → ahora es `string` UUID.

### Progreso

#### ✅ `clients` — completado (2026-03-10)

**Tipos actualizados:**
- `types/clients.tsx` — `client_id: number` → `string`
- `types/orders.tsx` — `client_id?: number | null` → `string | null`
- `types/payments.tsx` — `client_id: number | null` → `string | null`
- `types/lotContainersStock.tsx` — `client_id: number | null` → `string | null`
- `types/lotContainerMovements.tsx` — `from_client_id`, `to_client_id` → `string | null`
- `types/SALES.tsx` — `client_id: number` → `string`
- `types/prices.tsx` — `EnabledPriceClient.client_id` + inline en `Price` → `string`

**Servicios actualizados:**
- `service/clients.tsx` — `getClient`, `updateClient`, `deleteClient` ahora reciben `string`
- `service/clientTransactions.tsx` — `getClientTransactions` recibe `clientId: string`
- `service/payments.tsx` — `registerClientPayment` recibe `clientId: string`
- `service/prices.tsx` — `addClientToPrice`, `removeClientFromPrice` reciben `clientId: string`

**Componentes actualizados:**
- `components/admin/selectors/clientSelector.tsx` — eliminado `Number(val)` al buscar cliente por UUID
- `pages/admin/clients/components/clientHistoricalMvts.tsx` — prop `selectedClientId: string`
- `pages/admin/clients/components/ClientInformationContainer.tsx` — prop `clientId: string`
- `components/admin/pricesManagement.tsx/UniversalPrices.tsx` — mutations `clientId: string`
- `components/admin/pricesManagement.tsx/StorePricesTab.tsx` — mutations `clientId: string`

#### ✅ `orders` — completado (2026-03-10)

**Tipos actualizados:**
- `types/orders.tsx` — `order_id: number` → `string`
- `types/payments.tsx` — `order_id: number` → `string`
- `types/orderItems.tsx` — `order_id: number` → `string`
- `types/SALES.tsx` — `order_id: number` → `string`
- `types/notifications.tsx` — `order_id?: number` → `string`

**Servicios actualizados:**
- `service/lotHistory.tsx` — nested `orders.order_id: number` → `string`
- `types/clientTransactions.tsx` — ya era `string`, sin cambios

#### ✅ `payments` — completado (2026-03-10)

**Tipos actualizados:**
- `types/payments.tsx` — `payment_id?: number` → `string`

#### ✅ `order_items` — completado (2026-03-10)

**Tipos actualizados:**
- `types/orderItems.tsx` — `order_item_id: number` → `string`

**Servicios actualizados:**
- `service/lotHistory.tsx` — `LotSaleRow.order_item_id: number` → `string`

#### ✅ `client_transactions` — completado (2026-03-10)

**Tipos actualizados:**
- `types/clientTransactions.tsx` — ya era `string`, sin cambios
- `types/providerTransactions.tsx` — ya era `string`, sin cambios

#### ✅ `terminal_sessions` — completado (2026-03-10)

**Tipos actualizados:**
- `types/terminalSession.tsx` — `terminal_session_id: number` → `string`
- `types/orders.tsx` — `terminal_session_id: number | null` → `string | null`
- `types/payments.tsx` — `terminal_session_id: number | null` → `string | null`

#### ✅ `stock_movements` — completado (2026-03-10)

**Tipos actualizados:**
- `types/stockMovements.tsx` — `stock_movement_id?: number` → `string`

**Servicios actualizados:**
- `service/lotHistory.tsx` — `LotWasteRow.stock_movement_id: number` → `string`

#### ⏳ Pendientes
- `stock`

## Archivo SQL

La migración completa está en `migration_uuid_local_first.sql`. Ejecutar en Supabase SQL Editor en una DB sin datos de producción (incluye TRUNCATE CASCADE de las tablas afectadas).
