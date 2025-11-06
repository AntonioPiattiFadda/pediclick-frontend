import type { Product } from "./products";

export interface TransferOrderItem {
    transfer_order_item_id?: number;
    transfer_order_id: number;
    product_id: number | null;
    lot_id: number | null;
    quantity: number;
    is_transferred: boolean;
    created_at?: string;

    isNew?: boolean;
    product?: Product | null;
}
