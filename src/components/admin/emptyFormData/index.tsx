import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";
import type { Product } from "@/types/products";

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

export const emptyProduct: Pick<Product, "product_id" | "product_name" | "short_code" | 'updated_at'> = {
  short_code: null,
  product_name: "",
  // product_description: "",
  // category_id: null,
  // sub_category_id: null,
  // brand_id: null,
  // barcode: null,
  // iva_id: null,
  // public_image_id: null,
  // observations: "",
  // allow_stock_control: false,
  // lot_control: false,
  // equivalence_minor_mayor_selling: {
  //   minor: null,
  //   mayor: null,
  // },
  // created_at: "",
  updated_at: "",
};

export const emptyLot: Lot = {
  lot_id: 0,
  created_at: '',
  updated_at: '',
  bulk_quantity_equivalence: null,
  expiration_date: null,
  expiration_date_notification: false,
  provider_id: null,
  load_order_id: null,
  product_id: 0,
  is_sold_out: false,
  initial_stock_quantity: 0,

  purchase_cost_per_bulk: null,
  purchase_cost_total: null,
  purchase_cost_per_unit: null,

  final_cost_total: null,
  final_cost_per_bulk: null,
  final_cost_per_unit: null,

  download_total_cost: null,
  download_cost_per_bulk: null,
  download_cost_per_unit: null,

  delivery_cost_total: null,
  delivery_cost_per_unit: null,
  delivery_cost_per_bulk: null,
  productor_commission_type: "NONE",

  productor_commission_percentage: null,
  productor_commission_unit_value: null,

  purchasing_agent_id: null,
  purchasing_agent_commision_type: "NONE",
  purchasing_agent_commision_percentage: null,
  purchasing_agent_commision_unit_value: null,

  is_expired: false,
  is_finished: false,

  extra_cost_total: null,
};

export const emptyPrices: Price[] = [];

// export const emptyStockMovement: StockMovement = {
//   lot_id: 0,
//   movement_type: "TRANSFER",
//   quantity: null,
//   created_at: null,
//   from_location_id: null,
//   to_location_id: null,
//   should_notify_owner: false,
// };

export const emptyLotContainerStock: LotContainersStock = {
  lot_container_stock_id: 0,
  lot_container_id: null,
  quantity: null,
  created_at: null,
  location_id: null,
  client_id: null,
  provider_id: null,
  lot_container_name: null,
  transfer_order_item_id: null,
  lot_container_status: null,
}