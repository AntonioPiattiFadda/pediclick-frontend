# INPUT_UNDEFINED — Inputs numéricos que aceptan vacío (null)

## Problema

Un `<Input type="number">` controlado en React con estado `number | null` puede quedar "atascado" en `0` al borrar el campo, porque:

```ts
Number("") === 0  // no null
```

Esto hace que el campo nunca quede vacío visualmente y el estado nunca vuelva a `null`.

## Solución

### Estado

```ts
const [shortCode, setShortCode] = useState<number | null>(null);
```

### Value

No usar `value={shortCode ?? ""}` con `type="number"`. En su lugar, convertir a string explícitamente y **omitir** `type="number"`:

```tsx
value={shortCode === null ? "" : String(shortCode)}
```

### onChange

Usar `|| null` para que cualquier valor falsy (incluyendo `0` de string vacío) se convierta en `null`:

```tsx
onChange={(e) => {
  setShortCode(Number(e.target.value) || null);
}}
```

## Ejemplo completo

```tsx
const [code, setCode] = useState<number | null>(null);

<Input
  value={code === null ? "" : String(code)}
  placeholder="---"
  onChange={(e) => setCode(Number(e.target.value) || null)}
/>
```

## Componentes que aplican este patrón

- `src/components/admin/selectors/productSelector.tsx` — input de código corto de producto
- `src/components/admin/selectors/productPresentationSelector.tsx` — input de código corto de presentación
