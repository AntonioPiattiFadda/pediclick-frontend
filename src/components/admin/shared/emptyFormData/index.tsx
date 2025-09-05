import type { Lot } from "@/types/lots";

export const emptyLot: Lot = {
  lot_number: null,
  expiration_date: null,
  expiration_date_notification: false,
  provider_id: null,
  is_sold_out: false,
  lot_container_id: null,
  initial_stock_quantity: 0,
  sale_units_equivalence: {
    minor: {
      quantity_in_base: 0,
    },
    mayor: {
      quantity_in_base: 0,
    },
  },
  waste: null,
  //  {
  //   quantity: null,
  //   created_at: null,
  //   should_notify_owner: false,
  //   location: null,
  // },
  prices: [],
  stock: [],
  stock_movement: [],

  // acá decidís si querés que el control sea con stock único o no
  lot_control: false,
};
