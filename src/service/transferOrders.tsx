import type { TransferOrderItem } from "@/types/transferOrderItems";
import type { TransferOrderStatus, TransferOrderType } from "@/types/transferOrders";
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


/**
 * Fetch a single transfer order with its items
 */
export const getTransferOrder = async (
    transferOrderId: string | number
): Promise<{ dbTransferOrder: TransferOrderType | null; error: string | null }> => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data: dbTransferOrder, error } = await supabase
        .from("transfer_orders")
        .select(`
    *,
    transfer_order_items(
      *,
      product:product_id(*)
    )
  `)
        .eq("business_owner_id", businessOwnerId)
        .eq("transfer_order_id", transferOrderId)
        .is("deleted_at", null)
        .single();


    if (error) {
        throw new Error(error.message);
    }

    console.log("Fetched Transfer Order:", dbTransferOrder);

    // const adaptedTransferOrder = {
    //     ...dbTransferOrder,
    //     transfer_order_items: dbTransferOrder.transfer_order_items.map(() => {
    //         const adaptedOI = {
    //             ...dbTransferOrder.transfer_order_items,
    //             isNew: false,
    //         }
    //         console.log("adaptedOI:", adaptedOI);
    //         return {
    //             ...dbTransferOrder.transfer_order_items,
    //             isNew: false,
    //         }
    //     }) || []
    // };

    return { dbTransferOrder: (dbTransferOrder as TransferOrderType) ?? null, error: null };
};

/**
 * Create a new transfer order (empty draft by default)
 */
export const createTransferOrder = async (location: {
    from_store_id?: number | null;
    from_stock_room_id?: number | null;
}) => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data, error } = await supabase
        .from("transfer_orders")
        .insert({
            business_owner_id: businessOwnerId,
            transfer_order_status: "PENDING",
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
    // ✅ Convertir los datos a JSON limpio (sin referencias circulares ni campos opcionales que rompan el JSONB)
    const orderJson = JSON.parse(JSON.stringify(order));
    const itemsJson = items.map((i) => JSON.parse(JSON.stringify(i)));


    const { data, error } = await supabase.rpc("update_transfer_order_with_items", {
        p_transfer_order: orderJson,
        p_transfer_order_items: itemsJson,
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
export const setTransferOrderStatus = async (
    transferOrderId: number,
    nextStatus: TransferOrderStatus
) => {
    const { data, error } = await supabase
        .from("transfer_orders")
        .update({ transfer_order_status: nextStatus })
        .eq("transfer_order_id", transferOrderId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as TransferOrderType;
};
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