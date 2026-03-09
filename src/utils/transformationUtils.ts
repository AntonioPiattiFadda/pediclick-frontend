import type { ProductPresentation } from "@/types/productPresentation"
import type { TransformationItems } from "@/types/transformationItems"

// UI-only type: extends TransformationItems with a percentage field for TO items
export type ToItem = TransformationItems & { percentage: number }

export const generateNewFromItem = (
    newTransformationId: number,
    initialPresentation?: Pick<ProductPresentation, 'product_presentation_id' | 'product_presentation_name' | 'bulk_quantity_equivalence' | 'sell_unit' | 'auto_stock_calc' | 'lots' | 'product_id'>
): TransformationItems => ({
    transformation_item_id: Math.random(),
    transformation_id: newTransformationId,
    bulk_quantity_equivalence: initialPresentation?.bulk_quantity_equivalence ?? null,
    product_id: initialPresentation?.product_id ?? null,
    product_presentation_id: initialPresentation?.product_presentation_id ?? null,
    lot_id: null,
    stock_id: null,
    is_origin: true,
    quantity: null,
    quantity_in_base_units: null,
    max_quantity: null,
    product_presentation: initialPresentation ?? null,
    final_cost_per_unit: null,
    location_id: null,
    lot: null,
})

export const generateNewToItem = (newTransformationId: number, percentage = 0): ToItem => ({
    transformation_item_id: Math.random(),
    transformation_id: newTransformationId,
    bulk_quantity_equivalence: null,
    product_id: null,
    product_presentation_id: null,
    lot_id: null,
    stock_id: null,
    is_origin: false,
    quantity: null,
    quantity_in_base_units: null,
    max_quantity: null,
    product: null,
    product_presentation: null,
    final_cost_per_unit: null,
    location_id: null,
    lot: null,
    percentage,
})

/**
 * Single source of truth for item cost:
 * cost = final_cost_per_unit (per base unit) × quantity_in_base_units
 */
export const computeItemCost = (item: TransformationItems): number => {
    const qtyBase = item.quantity_in_base_units ?? ((item.quantity || 0) * (item.bulk_quantity_equivalence || 1))
    return (item.final_cost_per_unit || 0) * qtyBase
}

/**
 * Recomputes all TO item costs based on their current percentages and
 * the new totalToCost (= fromTotalCost + transformationCost).
 * Called on every change that affects costs.
 */
export const recalcToItemCosts = (
    toItems: ToItem[],
    fromItems: TransformationItems[],
    transformationCost: number
): ToItem[] => {
    const newFromTotalCost = fromItems.reduce((acc, item) => acc + computeItemCost(item), 0)
    const newTotalToCost = newFromTotalCost + transformationCost
    return toItems.map(item => ({
        ...item,
        final_cost_total: newTotalToCost * (item.percentage / 100),
    }))
}
