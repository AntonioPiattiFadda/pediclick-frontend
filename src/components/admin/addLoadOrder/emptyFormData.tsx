export const emptyLoadOrder = {
  load_order_id: "",
  load_order_number: "",
  provider_id: "",
  delivery_date: new Date().toISOString().split("T")[0],
  receptor_id: "",
  transporter_data: {
    delivery_company: "",
    name: "",
    licence_plate: "",
  },
  delivery_price: "",
  assigned_to: "",
  invoice_number: "",
  //Aun no darle bola
  lots: [],
  prices: [],
};
