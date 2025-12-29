import type { MovementStatus } from ".";
import type { PriceLogicType, PriceType } from "./prices";
import type { ProductPresentation } from "./productPresentation";
import type { Product } from "./products";

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_presentation_name: string;
  product_presentation_id: number;
  lot_id: number;
  stock_id: number;
  location_id: number;

  //La va a determinar la balanza si es producto por kg
  //Si es por unidad lo va a seleccionar el usuario
  //Se calculaara price en base a esto

  quantity: number;
  price: number;

  price_type: PriceType;
  logic_type: PriceLogicType;

  subtotal: number;


  discount?: number;
  tax?: number;
  is_deleted: boolean;

  total: number;
  status: MovementStatus;

  created_at: string;

  product: Pick<Product, "product_id" | "product_name" | "short_code" | 'sell_measurement_mode' | 'updated_at'> | null;
  product_presentation: ProductPresentation | null;
}
