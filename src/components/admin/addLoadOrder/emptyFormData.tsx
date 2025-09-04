export const emptyLoadOrder = {
  load_order_id: "",
  load_order_number: "",
  provider_id: "",
  delivery_date: "",
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
  lots: [
    {
      lot_id: "",
      product_id: "",
      quantity: "",
      price: "",
    },
  ],
};

export const emptyEmployee = {
  id: "",
  email: "",
  full_name: "",
  avatar_url: "",
  phone: "",
  role: "",
  is_verified: false,
  created_at: "",
  updated_at: "",
  deleted_at: "",
  is_active: false,
};
