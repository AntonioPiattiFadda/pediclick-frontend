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
  `)
        .eq("lot_id", lotId)

    const adaptedLotStock = data?.map(stock => ({
        ...stock,
        store_name: stock.stores?.store_name || null,
        stock_room_name: stock.stock_rooms?.stock_room_name || null,
    })) || [];

    console.log("getLotStocks", lotId, adaptedLotStock, error);

    if (error) {
        throw new Error(error.message);
    }

    return { lotStock: adaptedLotStock, error };
};