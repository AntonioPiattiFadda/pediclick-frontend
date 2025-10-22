//Crear tabla intermedia entre producto y lote

import type { Price } from "./prices";
import type { Stock } from "./stocks";

// Asignación de vacíos por lote (soporta múltiples vacíos por lote)
export type LotContainerAssignment = {
  lot_container_id: number;
  quantity: number;
};

export type BaseLot = {
  lot_id?: number;
  load_order_id: number | null;
  product_name?: string;

  //Cree una tabla intermedia al pedo porque el lote tiene que estar asociado a un producto
  product_id: number;
  lot_number: number | null;
  expiration_date: string | null;
  expiration_date_notification: boolean;
  //Vendra del remito porque el remito es quien crea los lotes.
  provider_id: number | null;

  //Creo que esto no tiene sentido
  sale_units_equivalence: {
    minor: {
      quantity_in_base: 0;
    };
    mayor: {
      quantity_in_base: 0;
    };
  };

  has_lot_container: boolean;

  lot_containers: {
    lot_container_id: number | null;
    quantity: number | null;
  }[];

  is_parent_lot: boolean;
  parent_lot_id: number | null;

  lot_control: boolean;
  //Caracteristicas inmutables
  initial_stock_quantity: number;
  is_sold_out: boolean;
  is_expired: boolean;


  // // Tiene el mismo nombre que en producto para saber si tiene control de lotes
  // uses_lots: boolean;
  // //NEW
  // tracks_stock: boolean;
  // is_unassigned_stock: boolean;

  providers?: {
    provider_name: string;
  };

  stockData?: {
    stock?: Stock;
    lot_number: number;
    lot_id: number;
    totalQty: number | null;
    purchase_cost_per_unit: number | null;

  };

  stock?: Stock[];
  prices?: Price[];

  current_stock_quantity?: number;


  download_total_cost: number | null;
  download_cost_per_unit: number | null;

  purchase_cost_total: number | null;
  purchase_cost_per_unit: number | null;

  extra_cost_total: number | null;        // transporte, descarga, comisiones prorrateadas
  extra_cost_per_unit: number | null;

  final_cost_total: number | null;        // purchase_cost_total + extra_cost_total
  final_cost_per_unit: number | null;
  //NOTE informacion de la compra. SI esta liquidado

  has_transport_cost_divided: boolean;
};

export type LotWithControl = BaseLot & {
  lot_control: true;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;
