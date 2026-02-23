import type { Price } from "@/types/prices";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pricesAdapter = (prices: any[], locationId: number | null): Price[] => {
    return prices.map((p) => ({
        price_id: p.is_new ? undefined : p.price_id,
        location_id: locationId,
        price_number: p.price_number,
        price: p.price,
        qty_per_price: p.qty_per_price,
        profit_percentage: p.profit_percentage,
        product_presentation_id: p.product_presentation_id,
        logic_type: p.logic_type,
        observations: p.observations,
        is_active: p.is_active,
        valid_from: p.valid_from,
        valid_until: p.valid_until,
    }));
}