import type { Price, PriceLogicType, PriceType } from "@/types/prices";
import { supabase } from ".";

export const getProductPrices = async (productId: number, locationId: number | null) => {
  console.log("Fetching prices for productId:", productId, "and locationId:", locationId);
  let query = supabase
    .from("prices")
    .select(`*`)
    .eq("product_presentation_id", productId);

  if (locationId !== null) {
    query = query.eq("location_id", locationId);
  } else {
    query = query.is("location_id", null);
  }




  const { data: productPrices, error } = await query;

  console.log("productPrices", productPrices);

  if (error) throw new Error(error.message);

  return { productPrices, error: null };
};

export const getAllProductPrices = async (productId: number) => {
  const query = supabase
    .from("prices")
    .select(`*`)
    .eq("product_id", productId);

  const { data: productPrices, error } = await query;

  if (error) throw new Error(error.message);

  return { productPrices, error: null };
};

export const getAllProductPresentationPrices = async (productPresentationId: number) => {
  const query = supabase
    .from("prices")
    .select(`*`)
    .eq("product_presentation_id", productPresentationId);

  const { data: productPresentationPrices, error } = await query;

  if (error) throw new Error(error.message);

  return { productPresentationPrices, error: null };
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
  // 1. Buscar el último lote creado del producto
  const { data: lots, error: lotError } = await supabase
    .from("lots")
    .select("lot_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(2);

  const lastLot = lots?.[1] ? lots[1] : null; // Obtener el penúltimo lote si existe, sino el último

  if (lotError) throw new Error(lotError.message);
  if (!lastLot) return [];

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

  if (error) throw new Error(error.message);

  return data;
};

export const createPrices = async (priceData: Price[], pricesToDelete: number[]) => {
  console.log("Creating prices with data:", priceData, "and deleting prices with IDs:", pricesToDelete);
  const { data, error } = await supabase.rpc(
    "update_prices",
    { p_prices: priceData, p_delete_ids: pricesToDelete }
  );

  if (error) throw new Error(error.message);

  return data;
};
