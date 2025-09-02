import type { LotContainer } from "@/types/lotContainers";
import type { Lot } from "@/types/lots";

export const emptyLot: Lot = {
  lot_number: "",
  expiration_date: null,
  expiration_date_notification: false,
  provider_id: null,
  stock: [],
  stock_movement: [],

  lot_container: null as LotContainer | null,
  waste: {
    quantity: null,
    created_at: null,
    should_notify_owner: false,
    location: null,
  },
  providers: {
    provider_name: "",
  },
  prices: [],
  // acá decidís si querés que el control sea con stock único o no
  lot_control: false,
};
