import type { Lot } from "./lots";
import type { Price } from "./prices";

export type ProductPresentation = {
    product_presentation_id: number;
    product_presentation_name: string;
    product_id: number;
    short_code: number;
    created_at: string;
    updated_at: string;

    bulk_quantity_equivalence: number | null;

    // allow_price_edition: boolean;
    // minimum_price: number | null;

    prices: Price[];
    lots?: Lot[];

    products?: {
        product_name: string;
    };

}