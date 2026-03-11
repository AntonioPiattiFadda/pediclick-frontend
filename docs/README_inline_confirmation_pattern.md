# Patrón: Confirmación inline antes de submit

## Problema

A veces un formulario puede enviarse en un estado válido pero incompleto (ej: stock sin asignar a ninguna ubicación). En estos casos no queremos bloquearlo con error, sino **advertir al usuario y pedirle confirmación antes de continuar**.

## Solución: estado `pendingConfirm`

En lugar de usar un Dialog secundario o `window.confirm()`, la confirmación se muestra **dentro del propio footer del formulario**, reemplazando los botones de acción por un mensaje de advertencia + botones de confirmar/volver.

## Implementación de referencia

`src/pages/admin/stock/components/addStockBtn/addLotBtn.tsx`

### 1. Estado

```tsx
const [pendingConfirm, setPendingConfirm] = useState(false);
```

### 2. Separar la lógica de submit en dos funciones

```tsx
// Ejecuta el submit real, sin validaciones
const doSubmit = () => {
  // ... llamada a onAddElement / mutación
};

// Valida primero; si falta asignación, activa la advertencia
const handleSubmit = () => {
  // validaciones duras (bloquean con toast)
  if (!selectedProduct.product_id) { toast("..."); return; }
  if (!formData.initial_stock_quantity) { toast("..."); return; }

  // validación suave (pide confirmación)
  const hasAssignedStock = stock.some(s => (s.quantity || 0) > 0);
  if (!hasAssignedStock) {
    setPendingConfirm(true); // activa la advertencia, NO hace submit
    return;
  }

  doSubmit();
};
```

### 3. Footer con confirmación inline

```tsx
<DialogFooter>
  {pendingConfirm && (
    <span className="mr-auto text-sm text-amber-600 font-medium">
      ⚠️ El stock no fue asignado a ninguna ubicación. ¿Deseás continuar de todas formas?
    </span>
  )}

  <Button variant="outline" onClick={handleClose}>Cancelar</Button>

  {pendingConfirm ? (
    <>
      <Button variant="outline" onClick={() => setPendingConfirm(false)}>
        Volver
      </Button>
      <Button variant="destructive" onClick={doSubmit}>
        Continuar sin asignar
      </Button>
    </>
  ) : (
    <Button onClick={handleSubmit}>Agregar</Button>
  )}
</DialogFooter>
```

### 4. Resetear en handleClose

```tsx
const handleClose = () => {
  // ... reset del resto del estado
  setPendingConfirm(false);
};
```

## Cuándo usar este patrón

- El estado es **técnicamente válido** pero **semánticamente incompleto** (puede ser intencional).
- No queremos interrumpir el flujo con un Dialog extra.
- El usuario puede querer continuar de todas formas (no es un error duro).

## Cuándo NO usarlo

- La condición es un **error duro** que siempre debe bloquearse → usar `toast` y `return`.
- La confirmación requiere texto libre del usuario → usar un Dialog con Input.
- La acción es **irreversible y destructiva** → usar AlertDialog de shadcn/ui en su lugar.
