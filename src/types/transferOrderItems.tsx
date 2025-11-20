import type { LotContainerMovement } from "./lotContainerMovements";
import type { LotContainersLocation } from "./lotContainersLocation";
import type { Lot } from "./lots";
import type { ProductPresentation } from "./productPresentation";
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
    product_presentation?: ProductPresentation | null;
    lot?: Lot | null;

    lot_container_location?: LotContainersLocation | null;

    lot_container_movements?: LotContainerMovement | null;
}
