import type { SellUnit } from "@/types";
import { supabase } from ".";

// ─── Sales ────────────────────────────────────────────────────────────────────
// Direct query on order_items so we get product_presentation_name + qty_in_base_units

export type LotSaleRow = {
    order_item_id: number;
    lot_id: number;
    product_presentation_id: number | null;
    quantity: number;
    qty_in_base_units: number | null;
    price: number;
    total: number;
    created_at: string;
    product_presentations: {
        product_presentation_name: string;
        bulk_quantity_equivalence: number | null;
        sell_unit: SellUnit;
    } | null;
    orders: {
        order_id: number;
        order_number: number;
        order_status: string;
    } | null;
};

export const getLotSalesRpc = async (lotId: number): Promise<LotSaleRow[]> => {
    const { data, error } = await supabase
        .from("order_items")
        .select(`
            order_item_id,
            lot_id,
            quantity,
            qty_in_base_units,
            price,
            total,
            created_at,
            product_presentation_id,
            product_presentations(product_presentation_name, bulk_quantity_equivalence, sell_unit),
            orders(order_id, order_number, order_status)
        `)
        .eq("lot_id", lotId)
        .eq("status", "COMPLETED")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []) as LotSaleRow[];
};

// ─── Transformations ──────────────────────────────────────────────────────────
// RPC — no presentation concept here

export type LotTransformationRow = {
    transformation_id: number;
    transformation_date: string;
    transformation_cost: number | null;
    notes: string | null;
    transformation_item_id: number;
    is_origin: boolean;
    ti_lot_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    final_cost_total: number | null;
};

export const getLotTransformationsRpc = async (lotId: number): Promise<Partial<LotTransformationRow>[]> => {
    const { data, error } = await supabase.rpc("get_lot_transformations", { p_lot_id: lotId });
    if (error) throw new Error(error.message);
    return data ?? [];
};

// ─── Wastes ───────────────────────────────────────────────────────────────────

export type LotWasteRow = {
    stock_movement_id: number;
    created_at: string;
    lot_id: number;
    stock_id: number | null;
    quantity: number | null;
    qty_in_base_units: number | null;
    from_location_id: number | null;
    created_by: string | null;
    product_presentation_id: number | null;
    product_presentations: {
        product_presentation_name: string;
        bulk_quantity_equivalence: number | null;
        sell_unit: SellUnit;
    } | null;
    users: {
        full_name: string;
        email: string;
    } | null;
};

export const getLotWastesRpc = async (lotId: number): Promise<LotWasteRow[]> => {
    const { data, error } = await supabase
        .from("stock_movements")
        .select(`
            stock_movement_id,
            created_at,
            lot_id,
            stock_id,
            quantity,
            qty_in_base_units,
            from_location_id,
            created_by,
            product_presentation_id,
            product_presentations(product_presentation_name, bulk_quantity_equivalence, sell_unit),
            users(full_name, email)
        `)
        .eq("lot_id", lotId)
        .eq("movement_type", "WASTE")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as LotWasteRow[];
};
