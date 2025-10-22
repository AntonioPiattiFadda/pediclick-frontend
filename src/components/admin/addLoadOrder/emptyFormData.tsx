import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import type { LoadOrder } from "@/types/loadOrders";

export const emptyLoadOrder: LoadOrder = {
  load_order_number: null,
  provider_id: null,
  delivery_date: new Date().toISOString().split("T")[0],
  receptor_id: null,
  receptor_other: "",
  transporter_data: {
    delivery_company: "",
    name: "",
    licence_plate: "",
  },
  divide_transport_costs_btw_lots: false,
  delivery_price: null,
  invoice_number: null,
  observations: "",
  purchasing_agent_id: null,
  total_download_cost: null,
  productor_commission_type: "NONE",
  productor_commission_percentage: null,
  productor_commission_unit_value: null,
  buyer_commission_percentage: null,
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
};
