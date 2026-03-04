# README: Sistema de Costos de Lotes

## Principio fundamental

**Solo se persiste el dato atómico: `*_per_unit`.**
Todo lo demás se calcula on the fly.

```
*_total    = *_per_unit × initial_stock_quantity
*_per_bulk = *_per_unit × bulk_quantity_equivalence   (viene de product_presentations)
```

Nunca escribas ni leas `*_total` o `*_per_bulk` desde la base de datos. No existen.

---

## Columnas de costo en `lots`

| Columna | Descripción |
|---|---|
| `purchase_cost_per_unit` | Costo de compra por unidad base |
| `download_cost_per_unit` | Costo de descarga/flete por unidad base |
| `delivery_cost_per_unit` | Costo de entrega por unidad base |
| `extra_cost_per_unit` | Costos adicionales por unidad base |
| `final_cost_per_unit` | Costo final total por unidad base (suma de todos) |

### Columnas eliminadas — NO usar, NO insertar

| Columna eliminada | Cómo calcularla |
|---|---|
| `purchase_cost_total` | `purchase_cost_per_unit × initial_stock_quantity` |
| `purchase_cost_per_bulk` | `purchase_cost_per_unit × bulk_quantity_equivalence` |
| `download_total_cost` | `download_cost_per_unit × initial_stock_quantity` |
| `download_cost_per_bulk` | `download_cost_per_unit × bulk_quantity_equivalence` |
| `delivery_cost_total` | `delivery_cost_per_unit × initial_stock_quantity` |
| `delivery_cost_per_bulk` | `delivery_cost_per_unit × bulk_quantity_equivalence` |
| `final_cost_total` | `final_cost_per_unit × initial_stock_quantity` |
| `final_cost_per_bulk` | `final_cost_per_unit × bulk_quantity_equivalence` |
| `extra_cost_total` | `extra_cost_per_unit × initial_stock_quantity` |

### Cálculo en queries o frontend

```sql
-- Total de costo final de un lote
SELECT final_cost_per_unit * initial_stock_quantity AS final_cost_total
FROM lots WHERE lot_id = $1;

-- Costo por presentación (cajón, bolsa, etc.)
SELECT
  l.final_cost_per_unit * pp.bulk_quantity_equivalence AS final_cost_per_bulk
FROM lots l
JOIN product_presentations pp ON pp.product_id = l.product_id
WHERE l.lot_id = $1 AND pp.product_presentation_id = $2;
```

```ts
// Frontend
const finalCostTotal = lot.final_cost_per_unit * lot.initial_stock_quantity
const finalCostPerBulk = lot.final_cost_per_unit * presentation.bulk_quantity_equivalence
```

---

## Columnas de costo en `transformation_items`

| Columna | Descripción |
|---|---|
| `final_cost_per_unit` | Costo final por unidad base del item |

### Columnas eliminadas en transformation_items

| Columna eliminada | Cómo calcularla |
|---|---|
| `final_cost_per_bulk` | `final_cost_per_unit × bulk_quantity_equivalence` |
| `final_cost_total` | `final_cost_per_unit × quantity` |

---

## Los 3 flujos de ingreso y transformación

### Flujo 1 — Ingreso directo (load order)

Un lote se crea con su cantidad en **unidad base**. El frontend convierte antes de enviar.

**Ejemplo:** 1 cajón de 200 kg de naranja a $1/kg
```
initial_stock_quantity = 200   ← en kg (unidad base)
purchase_cost_per_unit = 1     ← $/kg
final_cost_per_unit    = 1     ← si no hay otros costos
```

Si hay múltiples costos, el frontend los suma antes de enviar:
```ts
final_cost_per_unit = purchase_cost_per_unit
                    + download_cost_per_unit
                    + delivery_cost_per_unit
                    + extra_cost_per_unit
```

**RPC:** `add_stock` / `create_load_order_with_lots_and_prices`

---

### Flujo 2 — Transformación real (N lotes origen → M lotes destino)

Productos distintos entre origen y destino (ej: naranjas → jugo + cáscara).

**Tablas:** `transformations` + `transformation_items`

```
transformation_type = 'REAL_TRANSFORMATION'
```

- Uno o más items con `is_origin = true` → se restan del stock
- Uno o más items con `is_origin = false` → se crean como lotes nuevos
- El costo se distribuye entre destinos por `cost_allocation_percentage`
- `transformations.transformation_cost` = costo operativo adicional (opcional)

**Fórmula del costo destino:**
```
base_cost = SUM(final_cost_per_unit_origen × qty_origen_en_unidad_base)
total_cost = base_cost + transformation_cost
final_cost_per_unit_destino = (total_cost × cost_allocation_percentage) / qty_destino_en_unidad_base
```

**La RPC calcula `final_cost_per_unit` server-side. El frontend solo manda los porcentajes.**

---

### Flujo 3 — Fracción con costo (mismo producto, distinta presentación + costo operativo)

Mismo producto, mismo lote, nueva presentación con costo de reempaque (ej: kilo suelto → bolsas de 500g + costo de bolsa + empleado).

**Tablas:** `transformations` + `transformation_items`

```
transformation_type = 'FRACTION_WITH_COST'
```

- Un único origen (`is_origin = true`)
- Un único destino (`is_origin = false`) — mismo `product_id`
- `transformations.transformation_cost` = costo operativo total del reempaque

**Fórmula del costo destino:**
```
origen_cost_total = final_cost_per_unit_origen × qty_origen_en_unidad_base
total_cost        = origen_cost_total + transformation_cost
final_cost_per_unit_destino = total_cost / qty_destino_en_unidad_base
```

**La RPC calcula `final_cost_per_unit` server-side. El frontend NO manda el costo del destino.**

---

## Trazabilidad de lotes

### Tabla `lot_traces`

Relación **muchos a muchos** entre lotes. Un lote destino puede venir de múltiples orígenes, y un lote origen puede generar múltiples destinos.

```
lot_from_id  →  lot_to_id
A            →  C
B            →  C
C            →  D
```

| Columna | Descripción |
|---|---|
| `lot_from_id` | Lote origen |
| `lot_to_id` | Lote destino |
| `transformation_id` | Qué transformación generó esta traza |

### Campos deprecados en `lots`

`parent_lot_id` e `is_parent_lot` son redundantes con `lot_traces`. No usarlos. La trazabilidad completa se reconstruye con `get_lot_universe(lot_id)` que hace el recorrido recursivo up/down tree.

---

## Stock siempre en unidad base

El stock se guarda **una sola vez en unidad base** por `lot_id + location_id`.

```
stock.quantity = 200   ← kg (nunca cajones ni bolsas)
```

Las cantidades por presentación se calculan al vuelo:
```
qty_en_cajones = stock.quantity / pp.bulk_quantity_equivalence
```

Al vender, el frontend convierte la presentación a unidad base antes de descontar:
```ts
qty_in_base_units = quantity_vendida × presentation.bulk_quantity_equivalence
```

---

## Reglas para cualquier RPC que toque costos

1. **Solo insertar `*_per_unit`** en `lots` y `transformation_items`
2. **Nunca insertar `*_total` ni `*_per_bulk`** — esas columnas no existen
3. **Para flujos 2 y 3, calcular `final_cost_per_unit` server-side** — no confiar en el valor que manda el cliente
4. **Stock siempre en unidad base** — el frontend convierte antes de enviar
5. **`final_cost_per_unit` del lote destino** debe reflejar el costo heredado del origen + el costo operativo prorrateado
