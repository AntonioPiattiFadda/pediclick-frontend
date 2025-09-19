import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";

export const emptyLoadOrder = {
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
  delivery_price: null,
  invoice_number: null,
  //Aun no darle bola
  lots: [] as Lot[],
};

export const emptyStock: Stock = {
  location_id: null,
  current_quantity: 0,
  lot_id: 0,
  min_notification: 0,
  max_notification: 0,
  stock_type: "NOT ASSIGNED",
  transformed_from_product_id: null,
  transformed_to_product_id: null,
  last_updated: null,
};
