# Registrar Merma — Porting Guide

Everything needed to port the "Registrar Merma" feature to another project.

---

## What it does

A modal accessible from the header menu that lets the operator register stock waste (merma). The operator picks a product, a presentation, a lot, and a quantity. The system stores both the presentation-unit quantity and the base-unit quantity, mirroring how order items work.

---

## 1. DB Migration

Run these in Supabase SQL editor.

### 1.1 Alter `stock_movements` table

```sql
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS product_presentation_id INTEGER REFERENCES product_presentations(product_presentation_id),
  ADD COLUMN IF NOT EXISTS qty_in_base_units NUMERIC;
```

### 1.2 Update RPC `create_stock_movement_waste`

```sql
CREATE OR REPLACE FUNCTION create_stock_movement_waste(
  p_lot_id                  INTEGER,
  p_stock_id                INTEGER,
  p_movement_type           TEXT,
  p_quantity                NUMERIC,          -- presentation units (what the operator entered)
  p_qty_in_base_units       NUMERIC,          -- quantity × bqe (what gets deducted from stock)
  p_product_presentation_id INTEGER,
  p_from_location_id        INTEGER,
  p_to_location_id          INTEGER,
  p_should_notify_owner     BOOLEAN,
  p_created_by              UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO stock_movements (
    lot_id,
    stock_id,
    movement_type,
    quantity,
    qty_in_base_units,
    product_presentation_id,
    from_location_id,
    to_location_id,
    should_notify_owner,
    created_by
  ) VALUES (
    p_lot_id,
    p_stock_id,
    p_movement_type,
    p_quantity,
    p_qty_in_base_units,
    p_product_presentation_id,
    p_from_location_id,
    p_to_location_id,
    p_should_notify_owner,
    p_created_by
  );

  -- Stock is always in base units — deduct using qty_in_base_units
  UPDATE stock
  SET quantity = quantity - p_qty_in_base_units
  WHERE stock_id = p_stock_id;
END;
$$;
```

> **Note:** If the existing RPC already deducts using `p_quantity`, switch it to use `p_qty_in_base_units`.

---

## 2. TypeScript type

Update or create `src/types/stockMovements.tsx`:

```ts
export type StockMovement = {
  stock_movement_id?: number;
  lot_id: number;
  stock_id: number;
  movement_type: "TRANSFER" | "WASTE";
  quantity: number | null;           // presentation units
  qty_in_base_units: number | null;  // quantity × bqe
  product_presentation_id: number | null;
  created_at?: string | null;
  from_location_id: number | null;
  to_location_id: number | null;
  should_notify_owner: boolean;
  created_by: string | null;
};
```

---

## 3. Service layer

### 3.1 `createWasteStockMovement` — update RPC call

```ts
// src/service/stockMovement.tsx
import { StockMovement } from "@/types/stockMovements";
import { supabase } from ".";

export const createWasteStockMovement = async (
  formData: Omit<StockMovement, "stock_movement_id">
) => {
  const { data, error } = await supabase.rpc("create_stock_movement_waste", {
    p_lot_id: formData.lot_id,
    p_stock_id: formData.stock_id,
    p_movement_type: formData.movement_type,
    p_quantity: formData.quantity,
    p_qty_in_base_units: formData.qty_in_base_units,
    p_product_presentation_id: formData.product_presentation_id,
    p_from_location_id: formData.from_location_id ?? null,
    p_to_location_id: formData.to_location_id ?? null,
    p_should_notify_owner: formData.should_notify_owner ?? false,
    p_created_by: formData.created_by ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
};
```

### 3.2 `getLotsForProduct` — new query for the lot selector

```ts
// add to src/service/stockMovement.tsx (or a lots service file)

export type LotForWaste = {
  lot_id: number;
  created_at: string;
  stock: Array<{ stock_id: number; quantity: number; location_id: number }>;
};

export const getLotsForProduct = async (
  productId: number,
  locationId: number
): Promise<LotForWaste[]> => {
  const { data, error } = await supabase
    .from("lots")
    .select(`
      lot_id,
      created_at,
      stock!inner(
        stock_id,
        quantity,
        location_id
      )
    `)
    .eq("product_id", productId)
    .eq("is_sold_out", false)
    .eq("stock.location_id", locationId)
    .gt("stock.quantity", 0);

  if (error) throw new Error(error.message);
  return (data ?? []) as LotForWaste[];
};
```

---

## 4. Modal component

Create `src/components/registerWaste/RegisterWasteModal.tsx`.

### Key logic

```
quantity (presentation units)  ×  bqe  =  qty_in_base_units
```

- `bqe` = `presentation.bulk_quantity_equivalence ?? 1`
- `qty_in_base_units` is what gets subtracted from `stock.quantity`
- `quantity` is what the operator sees and enters

### Cascade reset rules

| When this changes | Clear these |
|---|---|
| Product | presentation, lot, quantity |
| Presentation | lot, quantity |
| Lot | quantity |

### What to display below the quantity input

Show a human-readable label: **`{quantity} {presentationName} de {productName}`**

If bqe ≠ 1, also show: `= {qty_in_base_units} unidades base`

### Dependencies needed from the other project

| Thing needed | Where to get it |
|---|---|
| `ProductSelector` | `src/components/shared/selectors/productSelector.tsx` |
| `ProductPresentationSelectorRoot` + `SelectProductPresentation` | `src/components/shared/selectors/productPresentationSelector.tsx` |
| `bqeOrOne(bqe)` | `src/utils/index.tsx` |
| `toBase(qty, bqe)` | `src/utils/index.tsx` |
| `useGetLocationData().handleGetLocationId()` | `src/hooks/useGetLocationData.tsx` — reads `localStorage.selectedStore.location_id` |
| `getUserId()` | `src/service/index.tsx` — reads from `supabase.auth.getUser()` |

If the other project does not have `ProductPresentationSelectorRoot`, you can replace it with a plain `<Select>` populated via `getProductPresentationsSummary(productId)` (see `src/service/productPresentations.tsx`).

---

## 5. Wire up the header

```tsx
// In your header/nav component:
const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);

// Menu item:
<MenuItem onClick={() => setIsWasteModalOpen(true)}>
  Registrar merma
</MenuItem>

// Place the modal alongside other modals:
<RegisterWasteModal
  open={isWasteModalOpen}
  onOpenChange={setIsWasteModalOpen}
/>
```

---

## 6. Stock model reminder

`stock.quantity` is always in **base units** (e.g., kg).

- `bulk_quantity_equivalence` (bqe) on the presentation converts: `1 cajón = 200 kg base`
- `null` bqe → treat as 1 (no conversion needed)
- The waste deduction hits the DB in base units via `qty_in_base_units`
