export type Stock = {
  stock_id?: number | null;
  product_id?: number;
  store_id: number | null;
  stock_room_id: number | null;
  current_quantity: number;
  lot_id: number;
  min_notification: number | null;
  max_notification: number | null;
  isNew?: boolean;
  stock_type:
  | "STORE"
  | "WASTE"
  | "NOT ASSIGNED"
  | "SOLD"
  | "TRANSFORMED"
  | "STOCKROOM";


  reserved_for_transfering_quantity: number | null;
  reserved_for_selling_quantity: number | null;


  transformed_from_product_id: number | null;
  transformed_to_product_id: number | null;

  last_updated: string | null;
};
