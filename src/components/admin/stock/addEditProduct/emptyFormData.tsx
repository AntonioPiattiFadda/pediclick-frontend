export const emptyLotWithoutControl = {
  provider_id: "",
  expiration_date: "",
  expiration_date_notification: false,
  lot: "NO CONTROL LOT",
  lot_control: false,
  stock: {
    quantity: 0,
    min: 0,
    max: 0,
  },
  bulk: "",
  waste: "",
  prices: [{ price: "", quantity: "", type: "PRIMARY" }],
};

export const emptyLotWithLotControl = {
  provider_id: "",
  expiration_date: "",
  expiration_date_notification: false,
  lot: "Lote 1",
  lot_control: true,
  stock: {
    quantity: 0,
    min: 0,
    max: 0,
  },
  bulk: "",
  waste: "",
  prices: [{ price: "", quantity: "", type: "PRIMARY" }],
};

export const emptyProduct = {
  short_code: "",
  product_name: "",
  product_description: "",
  category_id: "",
  sub_category_id: "",
  brand_id: "",
  sale_unit_id: "",
  barcode: "",
  public_image_id: "",
  observations: "",
  sell_measurement_mode: "QUANTITY",
  allow_stock_control: false,
  lot_control: false,
  equivalence_minor_mayor_selling: {
    minor: null,
    mayor: null,
  },
  created_at: "",
  updated_at: "",
};
