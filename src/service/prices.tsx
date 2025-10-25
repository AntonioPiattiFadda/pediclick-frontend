import type { Price, PriceLogicType, PriceType } from "@/types/prices";
import { supabase } from ".";

export const getProductPrices = async (productId: number) => {
  console.log("getProductPrices called with productId:", productId);
  const { data: productPrices, error } = await supabase
    .from("prices")
    .select(`*`)
    .eq("product_id", productId);

  if (error) throw new Error(error.message);

  return { productPrices, error: null };
};

export const getStockPrices = async (stockId: number) => {
  const { data: stockPrices, error } = await supabase
    .from("prices")
    .select(`*`)
    .eq("stock_id", stockId);

  if (error) throw new Error(error.message);

  return { stockPrices, error: null };
};



export const getPreviousPrice = async (
  productId: number,
  priceType: PriceType,
  logicType: PriceLogicType,
  storeId?: number
) => {
  console.log("getPreviousPrice called with:", { productId, priceType, logicType, storeId });
  // 1. Buscar el último lote creado del producto
  const { data: lots, error: lotError } = await supabase
    .from("lots")
    .select("lot_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(2);

  console.log("Last lot data:", lots, lotError);

  const lastLot = lots?.[1] ? lots[1] : null; // Obtener el penúltimo lote si existe, sino el último

  if (lotError) throw new Error(lotError.message);
  if (!lastLot) return [];

  console.log("Last lot found:", productId, lastLot.lot_id, priceType, logicType, storeId);

  // 2. Buscar el último preci registrado para ese lote
  let query = supabase
    .from("prices")
    .select("*")
    .eq("product_id", productId)
    .eq("lot_id", lastLot?.lot_id)
    .eq("price_type", priceType)
    .eq("logic_type", logicType);

  if (storeId) {
    query = query.eq("store_id", storeId);
  }

  const { data, error } = await query
    .order("price_id", { ascending: false })

  console.log("Previous price data:", data);


  if (error) throw new Error(error.message);

  return data;
};

export const createPrices = async (priceData: Price[], pricesToDelete: number[]) => {
  console.log("Creating prices with data:", priceData);
  const { data, error } = await supabase.rpc(
    "update_prices",
    { p_prices: priceData, p_delete_ids: pricesToDelete }
  );

  console.log("createPrices response data:", data, error);

  if (error) throw new Error(error.message);

  return data;
};
