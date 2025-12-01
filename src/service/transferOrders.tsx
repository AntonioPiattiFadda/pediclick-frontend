import type { TransferOrderItem } from "@/types/transferOrderItems";
import type { TransferOrderType } from "@/types/transferOrders";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

/**
 * List all transfer orders for current business owner
 */
export const getAllTransferOrders = async () => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data: dbTransferOrders, error } = await supabase
        .from("transfer_orders")
        .select("*")
        .eq("business_owner_id", businessOwnerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return { dbTransferOrders, error: null };
};


export const getTransferOrder = async (
    transferOrderId: string | number
): Promise<{ dbTransferOrder: TransferOrderType | null; error: string | null }> => {

    const businessOwnerId = await getBusinessOwnerId();

    const { data: dbTransferOrder, error } = await supabase
        .from("transfer_orders")
        .select(`*,  
            assigned_user:assigned_user_id(
                id,
                short_code,
                full_name
            ),
            from_location:from_location_id(name),
            to_location_id,
            to_location:to_location_id(name, type),
            transfer_order_items(*,  
            lot_containers_movement:lot_containers_movement_id(*),
             product_presentation:product_presentation_id(
                product_presentation_id,
                product_presentation_name,
                short_code,
                lots(lot_id,
                created_at,
                stock(stock_id,
                quantity,
                stock_type,
                location_id,
                lot_containers_stock(*)
                )
                )
            ), 
                lot:lot_id(
                lot_id,
                created_at),    
            product:product_id(
                product_id,
                product_name,
                short_code)
    )
  `)
        .eq("business_owner_id", businessOwnerId)
        .eq("transfer_order_id", transferOrderId)
        .is("deleted_at", null)
        .single();


    if (error) {
        console.error("❌ Error fetching transfer order:", error);
        throw new Error(error.message);
    }


    const adaptedTransferOrder = {
        ...dbTransferOrder,
        assigned_user: dbTransferOrder?.assigned_user ?? null,
        transfer_order_items: dbTransferOrder.transfer_order_items.map((item: TransferOrderItem) => {
            const adaptedOI = {
                ...item,
                is_new: false,
                product: item.product ?? null,
                product_presentation: item?.product_presentation ?? null,
                lot: item.lot ?? null,
                // lot_container_location: item.lot_container_location ?? null,
                // lot_container_movements: item.lot_container_movements ?? null,
            }
            console.log("🟢 adaptedOI:", adaptedOI.product_presentation);
            return adaptedOI;
        }) || []
    };

    console.log("✅ Fetched transfer order:", adaptedTransferOrder);

    return { dbTransferOrder: (adaptedTransferOrder as TransferOrderType) ?? null, error: null };
};

export const createTransferOrder = async (location: {
    from_location_id?: number | null;
}) => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data, error } = await supabase
        .from("transfer_orders")
        .insert({
            business_owner_id: businessOwnerId,
            status: "PENDING",
            ...location
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as TransferOrderType;
};

/**
 * Patch/update a transfer order header fields
 */
export async function updateTransferOrderWithItems(
    order: TransferOrderType,
    items: TransferOrderItem[]
) {
    console.log("🔄 Updating transfer order with items:", order, items);


    const { data, error } = await supabase.rpc("update_transfer_order_with_items", {
        p_transfer_order: order,
        p_transfer_order_items: items,
    });


    if (error) {
        console.error("❌ Error updating transfer order:", error);
        throw error;
    }

    return data;
}

export async function transferOrderWithItems(
    order: TransferOrderType,
    items: TransferOrderItem[]
) {
    console.log("🔄 Updating transfer order with items:", order, items);


    const { data, error } = await supabase.rpc("transfer_order_with_items", {
        p_transfer_order: order,
        p_transfer_order_items: items,
    });


    if (error) {
        console.error("❌ Error updating transfer order:", error);
        throw error;
    }

    return data;
}

/**
 * Upsert items (create/update). Sends minimal set of allowed fields.
 * Uses onConflict on primary key (transfer_order_item_id).
 */

export const upsertTransferOrderItems = async (
    items: Array<Partial<TransferOrderItem>>
) => {
    if (!items?.length) return { data: [], error: null as string | null };

    const cleaned = items.map((it) => ({
        transfer_order_item_id: it.transfer_order_item_id ?? undefined,
        transfer_order_id: it.transfer_order_id!,
        product_id: it.product_id ?? null,
        lot_id: it.lot_id ?? null,
        quantity: it.quantity ?? 0,
        is_transferred: it.is_transferred ?? false,
    }));

    const { data, error } = await supabase
        .from("transfer_order_items")
        .upsert(cleaned, { onConflict: "transfer_order_item_id" })
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return { data: (data as TransferOrderItem[]) ?? [], error: null as string | null };
};

/**
 * Delete a single item by id
 */
export const deleteTransferOrderItem = async (transfer_order_item_id: number) => {
    const { error } = await supabase
        .from("transfer_order_items")
        .delete()
        .eq("transfer_order_item_id", transfer_order_item_id);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
};

/**
 * Simple workflow status transition.
 * If your backend defines RPCs for transitions, wire them here mirroring LoadOrders.
 */
// export const setTransferOrderStatus = async (
//     transferOrderId: number,
//     nextStatus: MovementStatus
// ) => {
//     const { data, error } = await supabase
//         .from("transfer_orders")
//         .update({ transfer_order_status: nextStatus })
//         .eq("transfer_order_id", transferOrderId)
//         .select()
//         .single();

//     if (error) {
//         throw new Error(error.message);
//     }

//     return data as TransferOrderType;
// };
/**
 * Delete a transfer order by id
 */
export const deleteTransferOrder = async (transferOrderId: number | string) => {
    const { error } = await supabase
        .from("transfer_orders")
        .update({ deleted_at: new Date() })
        .eq("transfer_order_id", transferOrderId);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
};