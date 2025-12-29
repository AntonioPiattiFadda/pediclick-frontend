export type StockMovement = {
  stock_movement_id: number;

  lot_id: number;
  stock_id: number;
  movement_type: "TRANSFER" | "WASTE";
  quantity: number | null;
  from_location_id: number | null;
  to_location_id: number | null;

  should_notify_owner: boolean;
  created_by: string | null;
  lot_containers_to_move?: { quantity: number } | null;
  created_at?: string | null;
};
