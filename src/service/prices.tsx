import type { DisabledPrice, EnabledPriceClient, Price } from "@/types/prices";
import { supabase } from ".";

export const getProductPrices = async (productId: number, locationId: number | null) => {
  console.log("Fetching prices for productId:", productId, "and locationId:", locationId);
  let query = supabase
    .from("prices")
    .select(`*, enabled_prices_clients(client_id)`)
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


export const getDisabledPrices = async (
  productPresentationId: number,
  locationId: number
): Promise<{ disabledPrices: DisabledPrice[] }> => {
  const { data: prices, error: pricesError } = await supabase
    .from("prices")
    .select("price_id")
    .eq("product_presentation_id", productPresentationId)
    .is("location_id", null);


  if (pricesError) throw new Error(pricesError.message);

  const priceIds = prices?.map((p) => p.price_id) ?? [];

  if (priceIds.length === 0) return { disabledPrices: [] };

  const { data, error } = await supabase
    .from("disabled_prices")
    .select("*")
    .eq("location_id", locationId)
    .in("price_id", priceIds);


  if (error) throw new Error(error.message);

  return { disabledPrices: data ?? [] };
};

export const disablePrice = async (priceId: number, locationId: number): Promise<DisabledPrice> => {
  const { data, error } = await supabase
    .from("disabled_prices")
    .insert({ price_id: priceId, location_id: locationId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const enablePrice = async (priceId: number, locationId: number): Promise<void> => {
  const { error } = await supabase
    .from("disabled_prices")
    .delete()
    .eq("price_id", priceId)
    .eq("location_id", locationId);

  if (error) throw new Error(error.message);
};

export const addClientToPrice = async (priceId: number, clientId: number): Promise<EnabledPriceClient> => {
  const { data, error } = await supabase
    .from("enabled_prices_clients")
    .insert({ price_id: priceId, client_id: clientId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const removeClientFromPrice = async (priceId: number, clientId: number): Promise<void> => {
  const { error } = await supabase
    .from("enabled_prices_clients")
    .delete()
    .eq("price_id", priceId)
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);
};

export const createPrices = async (priceData: Price[], pricesToDelete: number[]) => {
  if (pricesToDelete.length > 0) {
    const { error: clientsError } = await supabase
      .from("enabled_prices_clients")
      .delete()
      .in("price_id", pricesToDelete);

    if (clientsError) throw new Error(clientsError.message);

    const { error: disabledError } = await supabase
      .from("disabled_prices")
      .delete()
      .in("price_id", pricesToDelete);

    if (disabledError) throw new Error(disabledError.message);
  }

  const { data, error } = await supabase.rpc(
    "update_prices",
    { p_prices: priceData, p_delete_ids: pricesToDelete }
  );

  if (error) throw new Error(error.message);

  return data;
};
