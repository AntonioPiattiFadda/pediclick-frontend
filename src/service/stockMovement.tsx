import type { StockMovement } from "@/types/stockMovements";
import { supabase } from ".";

export const createStockMovement = async (formData: StockMovement) => {
    console.log("createStockMovement called with formData:", formData);
    const { data: stockMovementData, error: stockMovementError } = await supabase
        .rpc("transfer_stock", {
            p_lot_id: formData?.lot_id,
            p_movement_type: formData?.movement_type,
            p_quantity: formData?.quantity,
            p_from_stock_room_id: formData?.from_stock_room_id ?? null,
            p_to_stock_room_id: formData?.to_stock_room_id ?? null,
            p_from_store_id: formData?.from_store_id ?? null,
            p_to_store_id: formData?.to_store_id ?? null,
            p_should_notify_owner: formData?.should_notify_owner ?? false,
        });


    if (stockMovementError) {
        throw new Error(stockMovementError.message);
    }

    return stockMovementData;
};
