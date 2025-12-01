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
  quantity: 0,
  location_id: null,
  lot_id: 0,
  min_notification: 0,
  max_notification: 0,
  stock_type: "NOT_ASSIGNED",
  transformed_from_product_id: null,
  updated_at: null,
  reserved_for_transferring_quantity: 0,
  reserved_for_selling_quantity: 0,
};
