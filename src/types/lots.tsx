import type { LotContainer } from "./lotContainers";

type Location = {
  id: number;
  name: string;
};

export type Price = {
  price: string;
  quantity: string;
  type: "MINOR" | "MAYOR"; // Asumiendo que puede haber otros tipos además de PRIMARY
  quantity_discount: boolean;
};

export type Stock = {
  lot_id: number;
  //It will be moving across al owner worlds
  quantity: number;
  min: number;
  // It almost never be used
  max: number;

  //Asignar mundos
  stock_type: "STORE" | "WASTE" | "NOT ASSIGNED" | "SOLD" | "";

  //See how to represent the location, maybe by the id of each world
  location: Location | null;
};

export type StockMovement = {
  quantity: number | null;
  created_at: string | null;
  from: string | null;
  to: string | null;
} | null;

//Crear tabla intermedia entre producto y lote

export type BaseLot = {
  //El lote es siempre un numero?
  lot_number: string | number;

  expiration_date: string | null;
  expiration_date_notification: boolean;

  //Vendra del remito porque el remito es quien crea los lotes.
  provider_id: number | null;

  sale_units_equivalence: {
    minor: {
      quantity_in_base: 0;
    };
    mayor: {
      quantity_in_base: 0;
    };
  };

  stock: Stock[] | null;
  is_sold_out: boolean;

  stock_movement: StockMovement[] | null;

  lot_container: LotContainer | null;

  waste: {
    quantity: number | null;
    created_at: string | null;
    should_notify_owner: boolean;
    location: Location | null;
  };

  providers?: {
    provider_name: string;
  };

  prices: Price[];
};

export type LotWithControl = BaseLot & {
  lot_control: true;
  stock: Stock;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;
