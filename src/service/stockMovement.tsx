import type { StockMovement } from "@/types/stockMovements";
import { supabase } from ".";


export const createWasteStockMovement = async (formData: Omit<StockMovement, "stock_movement_id">) => {
    //TODO Agregar el business_owner_id al llamado y el stock id a la lot_containers_location nueva

    console.log("Creating waste stock movement with data:", formData);

    const { data: stockMovementData, error: stockMovementError } = await supabase
        .rpc("create_stock_movement_waste", {
            p_lot_id: formData?.lot_id,
            p_stock_id: formData?.stock_id,
            p_movement_type: formData?.movement_type,
            p_quantity: formData?.quantity,
            p_from_location_id: formData?.from_location_id ?? null,
            p_to_location_id: formData?.to_location_id ?? null,
            p_should_notify_owner: formData?.should_notify_owner ?? false,
            p_created_by: formData?.created_by ?? null,
            // p_lot_containers_to_move: formData?.lot_containers_to_move ?? null,
        });


    if (stockMovementError) {
        throw new Error(stockMovementError.message);
    }

    return stockMovementData;
};

export const getStockSalesHistory = async (lotId: number) => {
    const { data, error } = await supabase
        .rpc("get_stock_sales_history", {
            p_product_id: null,
            p_lot_id: lotId
        });

    if (error) console.error(error);

    return data;
}

export const getSalesHistoryByProductOrLot = async (lotId: number) => {
    const { data, error } = await supabase
        .rpc("get_sales_history_by_product_or_lots", {
            p_product_id: null,
            p_lot_id: lotId
        });


    if (error) console.error(error);

    return data;
}


export const assignStock = async (fromStockData: {
    stock_id: number;
    product_id: number | null;
}, stockMovement: Omit<StockMovement, "stock_movement_id" | "should_notify_owner" | "created_by" | "lot_containers_to_move" | "created_at">) => {

    const { data: assignedStockData, error: assignedStockError } = await supabase
        .rpc("assign_stock_to_location", {
            p_from_stock_data: fromStockData,
            p_stock_movement: stockMovement
        });

    if (assignedStockError) {
        throw new Error(assignedStockError.message);
    }

    return assignedStockData;
}