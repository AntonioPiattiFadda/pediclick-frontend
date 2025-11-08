import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import type { LoadOrder } from "@/types/loadOrders";
const now = new Date();

export const emptyLoadOrder: LoadOrder = {
  load_order_number: null,
  provider_id: null,
  delivery_date: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0],
  receptor_id: null,
  receptor_other: "",
  transporter_data: {
    delivery_company: "",
    name: "",
    licence_plate: "",
  },
  invoice_number: null,
  observations: "",
  lots: [] as Lot[],
};

export const emptyStock: Stock = {

  store_id: null,
  stock_room_id: null,
  current_quantity: 0,
  lot_id: 0,
  min_notification: 0,
  max_notification: 0,
  stock_type: "NOT ASSIGNED",
  transformed_from_product_id: null,
  transformed_to_product_id: null,
  last_updated: null,
  reserved_for_transfering_quantity: 0,
  reserved_for_selling_quantity: 0,
};
