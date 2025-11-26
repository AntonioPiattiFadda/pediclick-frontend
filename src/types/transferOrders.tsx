import type { MovementStatus } from "./lotContainerMovements";
import type { TransferOrderItem } from "./transferOrderItems";
import type { UserProfile } from "./users";

export interface TransferOrderType {
    transfer_order_id: number;
    created_at: string;
    assigned_user_id: string | null;

    assigned_user?: UserProfile | null;

    from_store_id: number | null;
    to_store_id: number | null;
    from_stock_room_id: number | null;
    to_stock_room_id: number | null;
    notes: string | null;

    status: MovementStatus;
    transfer_order_items?: TransferOrderItem[];



}
