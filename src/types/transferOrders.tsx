import type { MovementStatus } from ".";
import type { Location } from "./locations";
import type { TransferOrderItem } from "./transferOrderItems";
import type { UserProfile } from "./users";

export interface TransferOrderType {
    transfer_order_id: number;
    created_at: string;
    assigned_user_id: string | null;


    from_location_id: number | null;
    to_location_id: number | null;
    notes: string | null;


    status: MovementStatus;

    transfer_order_items?: TransferOrderItem[];

    from_location: Pick<Location, 'location_id' | 'name' | 'type'> | null;
    to_location: Pick<Location, 'location_id' | 'name' | 'type'> | null;
    assigned_user?: Pick<UserProfile, 'id' | 'full_name' | 'short_code'> | null;
}
