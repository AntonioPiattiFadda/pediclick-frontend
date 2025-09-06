import type { Lot } from "@/types/lots";

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
