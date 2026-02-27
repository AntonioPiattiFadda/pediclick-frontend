# Lot Lifecycle — RPCs

Tres funciones para consultar el historial completo de un lot. Se eliminó `get_lot_performance`.

---

## Funciones disponibles

### `get_lot_sales(p_lot_id)`
Ventas del lot cruzando `order_items` + `orders` + `products`.  
Retorna: `order_id`, `order_number`, `order_date`, `order_status`, `client_id`, `order_item_id`, `lot_id`, `product_id`, `product_name`, `quantity`, `price`, `total`.

### `get_lot_transformations(p_lot_id)`
Transformaciones donde el lot participó (como origen o resultado), cruzando `transformation_items` + `transformations` + `products`.  
Retorna: `transformation_id`, `transformation_date`, `transformation_cost`, `notes`, `transformation_item_id`, `is_origin`, `ti_lot_id`, `product_id`, `product_name`, `quantity`, `final_cost_total`.

> `is_origin = true` → el lot fue el insumo. `is_origin = false` → el lot fue el resultado.

### `get_lot_wastes(p_lot_id)`
Mermas del lot desde `stock_movements` con `movement_type = 'WASTE'`.  
Retorna: `stock_movement_id`, `waste_date`, `lot_id`, `stock_id`, `quantity`, `from_location_id`, `created_by`.

---

## Uso desde JS (Supabase)

```js
supabase.rpc('get_lot_sales',           { p_lot_id: 123 })
supabase.rpc('get_lot_transformations', { p_lot_id: 123 })
supabase.rpc('get_lot_wastes',          { p_lot_id: 123 })
```

---

## Tablas involucradas

| Función | Tablas |
|---|---|
| `get_lot_sales` | `order_items`, `orders`, `lots`, `products` |
| `get_lot_transformations` | `transformation_items`, `transformations`, `products` |
| `get_lot_wastes` | `stock_movements` |

---

## Notas
- `get_lot_performance` fue eliminada y reemplazada por estas 3 funciones.
- Todas tienen `SECURITY DEFINER` y grants para `anon`, `authenticated`, `service_role`.
- No usan `get_lot_universe` — consultan directamente por `lot_id` sin expandir el árbol de lotes relacionados.
