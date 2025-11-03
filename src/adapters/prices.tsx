import type { Price } from "@/types/prices";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pricesAdapter = (prices: any[], storeId: number | null): Price[] => {
    return prices.map((p) => ({
        price_id: p.isNew ? undefined : p.price_id,

        store_id: storeId,
        price_number: p.price_number,
        price: p.price,
        qty_per_price: p.qty_per_price,
        profit_percentage: p.profit_percentage,
        product_id: p.product_id,
        price_type: p.price_type,
        logic_type: p.logic_type,
        observations: p.observations,
        is_limited_offer: p.logic_type === "LIMITED_OFFER",
        is_active: p.is_active,
        valid_from: p.valid_from,
        valid_until: p.valid_until,
    }
    ));
}