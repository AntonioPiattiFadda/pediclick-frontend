# Rediseño: Fracción con Costo (Vía 3)

## Contexto

El sistema maneja 3 vías de transformación/fracción de productos:

| Vía | Nombre | Stock | Costo extra | Estado |
|-----|--------|-------|-------------|--------|
| 1 | Fracción sin costo | Auto-calculado (`stock.quantity / bulk_qty_eq`) | No | ✅ Implementado |
| 2 | Transformación | Nuevo producto con costeo proporcional | Sí | ✅ Implementado |
| 3 | **Fracción con costo** | Explícito (solo existe si se fraccionó manualmente) | Sí | ❌ A implementar |

**Ejemplo Vía 3:** Tengo bolsa de 10kg de tutuca. Quiero fraccionar en bolsitas de 500g. Esto tiene costo (mano de obra + bolsitas). No debe auto-calcularse.

---

## Decisiones de diseño

### 1. Reutilizar tabla `stock` (NO crear tabla nueva)

Se agrega `product_presentation_id` a la tabla `stock` existente:

- Filas con `product_presentation_id IS NULL` → stock base (comportamiento actual)
- Filas con `product_presentation_id` poblado → stock fraccionado con costo

### 2. Reutilizar tabla `transformations` (NO crear tabla nueva)

Una fracción con costo es semánticamente una transformación donde `origin_product_id = destination_product_id` pero con `product_presentation_id` diferente. Se agrega un enum `transformation_type` que se autodetermina en la función RPC:

- Si `origin_product_id ≠ destination_product_id` → `TRANSFORMATION`
- Si `origin_product_id = destination_product_id` con diferente presentación → `FRACTION`

### 3. Campo `auto_stock_calc` en `product_presentations`

Cada presentación define si su stock se calcula automáticamente o no:

- `auto_stock_calc = true` (default) → stock = `stock_base.quantity / bulk_quantity_equivalence` (comportamiento actual)
- `auto_stock_calc = false` → stock se lee de la fila en `stock` que tenga su `product_presentation_id`. Si no existe → stock = 0

---

## Migraciones SQL

### 1. Columna en `product_presentations`

```sql
ALTER TABLE product_presentations
  ADD COLUMN auto_stock_calc boolean NOT NULL DEFAULT true;
```

### 2. Columna en `stock` + actualizar unique index

```sql
ALTER TABLE stock
  ADD COLUMN product_presentation_id bigint
  REFERENCES product_presentations(product_presentation_id);

DROP INDEX stock_unique;

CREATE UNIQUE INDEX stock_unique
  ON stock (lot_id, product_id, location_id, coalesce(product_presentation_id, -1));
```

### 3. Enum `transformation_type` + columna en `transformations`

```sql
CREATE TYPE transformation_type AS ENUM ('TRANSFORMATION', 'FRACTION');

ALTER TABLE transformations
  ADD COLUMN transformation_type transformation_type NOT NULL DEFAULT 'TRANSFORMATION';
```

### 4. Columna `product_presentation_id` en `transformation_items` (si no existe)

Verificar la tabla `transformation_items`. Si no tiene `product_presentation_id`, agregar:

```sql
ALTER TABLE transformation_items
  ADD COLUMN product_presentation_id bigint
  REFERENCES product_presentations(product_presentation_id);
```

---

## Flujo operativo

### Al crear/editar una presentación

El usuario define `auto_stock_calc = true/false` en el formulario de presentaciones.

### Al mostrar stock en frontend

```
Para cada presentación del producto:
  if auto_stock_calc = true:
    stock_presentacion = stock_base.quantity / bulk_quantity_equivalence
  else:
    stock_presentacion = stock.quantity WHERE stock.product_presentation_id = presentacion.id
    (si no hay fila → stock = 0)
```

### Al vender

- Presentación `auto_stock_calc = true`: descontar de stock base → `stock.quantity -= (qty × bulk_qty_eq)` (fila con `product_presentation_id IS NULL`)
- Presentación `auto_stock_calc = false`: descontar de su fila propia → `stock.quantity -= qty` (fila con su `product_presentation_id`)

### Al fraccionar con costo

1. Usuario selecciona lote + presentación destino (`auto_stock_calc = false`) + cantidad + costos extra
2. Se llama a la RPC de transformación existente
3. La función detecta que `origin_product_id = destination_product_id` → setea `transformation_type = 'FRACTION'`
4. Se descuentan X unidades base del `stock` base (fila con `product_presentation_id IS NULL`)
5. Se crea/actualiza fila en `stock` con el `product_presentation_id` de la presentación destino
6. Se registra en `transformations` + `transformation_items` con el costeo
7. Se registra `stock_movement` con `movement_type = 'TRANSFORMED'`
8. Trazabilidad via `lot_traces` (mismo `lot_id` origen y destino)

---

## Cambios en funciones RPC existentes

### Función de transformación

- Agregar lógica para autodeterminar `transformation_type`:
  ```
  IF all origin product_ids = all destination product_ids THEN 'FRACTION'
  ELSE 'TRANSFORMATION'
  ```
- Al insertar en `stock` destino para fracciones: incluir `product_presentation_id`
- Registrar `transformation_type` en la tabla `transformations`

### Queries de stock (frontend y RPCs que lean stock)

- Todas las queries que leen stock base deben filtrar `WHERE product_presentation_id IS NULL` para no mezclar con stock fraccionado
- Las queries de stock de presentaciones `auto_stock_calc = false` deben buscar `WHERE product_presentation_id = X`

### Funciones afectadas a revisar

- `add_stock` → no debería verse afectada (ya inserta sin `product_presentation_id`)
- `assign_stock_to_location` → verificar que al transferir stock fraccionado mantenga el `product_presentation_id`
- `process_delivered_items_stock` → al vender presentación `auto_stock_calc = false`, buscar el stock correcto
- `get_last_over_sell_stock` → debe considerar `product_presentation_id` en el filtro
- `resolve_oversell_stock` → idem

---

## Resumen de cambios por tabla

| Tabla | Cambio |
|-------|--------|
| `product_presentations` | + `auto_stock_calc boolean NOT NULL DEFAULT true` |
| `stock` | + `product_presentation_id bigint` (nullable, FK) + actualizar unique index |
| `transformations` | + `transformation_type` enum (`TRANSFORMATION`, `FRACTION`) |
| `transformation_items` | + `product_presentation_id bigint` (si no existe) |

---

## Edge cases a considerar

- Una presentación `auto_stock_calc = false` sin stock fraccionado → mostrar 0, no permitir venta
- Al fraccionar, validar que hay suficiente stock base disponible
- Al transferir stock entre ubicaciones, respetar el `product_presentation_id` si está poblado
- Oversell en presentaciones fraccionadas: debe generar oversell en su propia fila de stock, no en el stock base
- Si se cambia `auto_stock_calc` de false a true en una presentación que ya tiene stock fraccionado: decidir qué hacer con ese stock (¿devolver al base? ¿bloquear el cambio?)
