import type { ProductPresentation } from "./productPresentation";
import type { Product } from "./products";

export type TransformationItems = {
    transformation_detail_id: number;
    transformation_id: number;

    product_id: number | null;
    product_presentation_id: number | null;
    lot_id: number | null;

    stock_id: number | null;

    is_origin: boolean;
    quantity: number | null;

    final_cost_per_unit: number | null;
    final_cost_per_bulk: number | null;
    final_cost_total: number | null;

    // lot_container_id: number | null;
    // lot_container_quantity: number | null;

    product?: Product | null;
    product_presentation: ProductPresentation | null;
}