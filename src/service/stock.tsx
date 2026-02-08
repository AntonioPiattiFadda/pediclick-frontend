import { supabase } from ".";

export const getLotStocks = async (lotId: number) => {

  const { data, error } = await supabase
    .from("stock")
    .select(`
    *,
    stores (
      store_name
    ),
    stock_rooms (
      stock_room_name
      )
         ,
       lot_containers_location (
         *
       )
      `)
    .eq("lot_id", lotId)


  const adaptedLotStock = data?.map(stock => ({
    ...stock,
    store_name: stock.stores?.store_name || null,
    stock_room_name: stock.stock_rooms?.stock_room_name || null,
    lot_containers_location: stock?.lot_containers_location[0] || [],
  })) || [];


  if (error) {
    throw new Error(error.message);
  }

  return { lotStock: adaptedLotStock, error };
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
    p_product_presentation_id: Number(productPresentationId),
    p_location_id: Number(locationId),
  });

  console.log('checkHasOverSell result', { data, error });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
