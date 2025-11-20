import type { StockMovement } from "@/types/stockMovements";
import { supabase } from ".";

export const createStockMovement = async (formData: StockMovement) => {
    //TODO Agregar el business_owner_id al llamado y el stock id a la lot_containers_location nueva


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
            p_lot_containers_to_move: formData?.lot_containers_to_move ?? null,
            // p_business_owner_id: businessOwnerId,
        });


    if (stockMovementError) {
        throw new Error(stockMovementError.message);
    }

    return stockMovementData;
};

// export const createWasteStockMovement = async (formData: StockMovement) => {
//     //TODO Agregar el business_owner_id al llamado y el stock id a la lot_containers_location nueva
//     console.log("createStockMovement called with formData:", formData);
//     const { data: stockMovementData, error: stockMovementError } = await supabase
//         .rpc("transfer_stock", {
//             p_lot_id: formData?.lot_id,
//             p_movement_type: formData?.movement_type,
//             p_quantity: formData?.quantity,
//             p_from_stock_room_id: formData?.from_stock_room_id ?? null,
//             p_to_stock_room_id: formData?.to_stock_room_id ?? null,
//             p_from_store_id: formData?.from_store_id ?? null,
//             p_to_store_id: formData?.to_store_id ?? null,
//             p_should_notify_owner: formData?.should_notify_owner ?? false,
//             p_lot_containers_to_move: formData?.lot_containers_to_move ?? null,
//             // p_business_owner_id: businessOwnerId,
//         });


//     if (stockMovementError) {
//         throw new Error(stockMovementError.message);
//     }

//     return stockMovementData;
// };


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
