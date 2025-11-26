import type { MovementStatus } from "./lotContainerMovements";

export type LotContainersLocation = {
  lot_container_location_id: number;
  // lot_id: number | null;
  lot_container_id: number | null;
  quantity: number | null;
  created_at: string | null;
  store_id: number | null;
  stock_room_id: number | null;
  client_id: number | null;
  provider_id: number | null;
  updated_at?: string | null;
  deleted_at?: string | null;

  lot_container_name?: string | null;
  transfer_order_item_id?: number | null;
  lot_container_status: MovementStatus | null;

};
