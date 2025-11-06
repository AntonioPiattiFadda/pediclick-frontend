import type { TransferOrderItem } from "./transferOrderItems";

export type TransferOrderStatus =
    'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface TransferOrderType {
    transfer_order_id: number;
    created_at: string;
    assigned_user_id: string | null;

    from_store_id: number | null;
    to_store_id: number | null;
    from_stock_room_id: number | null;
    to_stock_room_id: number | null;
    notes: string | null;

    transfer_order_status: TransferOrderStatus;
    transfer_order_items?: TransferOrderItem[];



}
