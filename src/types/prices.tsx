export type PriceLogicType = "QUANTITY_DISCOUNT" | "SPECIAL" | "LIMITED_OFFER";
export type PriceType = "MINOR" | "MAYOR";

export type Price = {
  price_id?: number;
  isNew?: boolean; // Para identificar precios nuevos que aún no están en la base de datos
  lot_id: number;
  store_id: number | null;
  stock_id: number;
  price_number: number;
  product_id: number;

  price: number;
  qty_per_price: number;
  profit_percentage: number;

  price_type: PriceType;
  logic_type: PriceLogicType;
  observations: string | null;

  is_limited_offer: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at?: string;
  updated_at?: string | null;
};
