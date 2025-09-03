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

//NOTE TIENE QUE SER TABLA
export type Stock = {
  lot_id: number;
  //It will be moving across al owner worlds
  current_stock_quantity: number;

  min_notification: number;
  // It almost never be used
  max_notification: number;

  mother_stock: number | null;
  //Asignar mundos

  //FIXME Buscar la palabra deposito en ingles
  stock_type:
    | "STORE"
    | "WASTE"
    | "NOT ASSIGNED"
    | "SOLD"
    | "TRANSFORMED"
    | "DEPOSITO";

  store_id: number | null;
  deposito_id: number | null;
  transformed_product_id: number | null;

  //See how to represent the location, maybe by the id of each world
  location: Location | null;

  transformed_stock_quantity: number;

  original_product: string | null;
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

  is_sold_out: boolean;

  stock_movement: StockMovement[] | null;

  lot_container: LotContainer | null;

  waste: {
    quantity: number | null;
    created_at: string | null;
    should_notify_owner: boolean;
    location: Location | null;
  };

  initial_stock_quantity: number;

  stock: Stock[] | null;
  prices: Price[];

  providers?: {
    provider_name: string;
  };
};

export type LotWithControl = BaseLot & {
  lot_control: true;
  stock: Stock;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;
