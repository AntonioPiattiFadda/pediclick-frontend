export interface LotContainerMovement {
    lot_container_movement_id: number;
    created_at: string;
    quantity: number;

    from_store_id: number | null;
    to_store_id: number | null;

    from_stock_room_id: number | null;
    to_stock_room_id: number | null;

    from_provider_id: number | null;
    to_provider_id: number | null;

    from_client_id: number | null;
    to_client_id: number | null;

    lot_container_id: number;
}
