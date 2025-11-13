import type { ProductPresentation } from "./product_presentation";
import type { Product } from "./products";

export type TransformationDetail = {
    transformation_detail_id: number;
    transformation_id: number;
    product_id: number | null;
    lot_id: number | null;
    is_origin: boolean;
    product_presentation_id: number | null;
    quantity: number;

    product?: Product | null;
    product_presentation: ProductPresentation | null;
}