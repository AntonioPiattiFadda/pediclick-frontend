import { supabase } from ".";

export const getLotStocks = async (lotId: number) => {

  const { data, error } = await supabase
    .from("stock")
    .select(`
    *`)
    .eq("lot_id", lotId)


  const adaptedLotStock = data?.map(stock => ({
    ...stock,
  })) || [];


  if (error) {
    throw new Error(error.message);
  }

  return { lotStock: adaptedLotStock, error };
};

export const correctStockOversell = async (stockId: number) => {
  const { data, error } = await supabase.rpc("correct_oversell_stock", {
    p_stock_id: stockId,
  });

  if (error) throw new Error(error.message);
  return data;
};

export const checkHasOverSell = async ({
  productId,
  productPresentationId,
  locationId,
}: {
  productId: number | null;
  productPresentationId: number | null;
  locationId: number | null;
}) => {
  console.log('checkHasOverSell called with', { productId, productPresentationId, locationId });

  if (!productId || !productPresentationId || !locationId) {
    throw new Error("Faltan parámetros para verificar el sobreventa");
  }

  const { data, error } = await supabase.rpc("get_last_over_sell_stock", {
    p_product_id: Number(productId),
    p_location_id: Number(locationId),
  });

  console.log('checkHasOverSell result', { data, error });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
