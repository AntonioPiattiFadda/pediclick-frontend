import type { Lot } from "@/types/lots";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const createLot = async (lot: Lot) => {
  const businessOwnerId = await getBusinessOwnerId();
  //Desestructurar el stock_movement y el stock porque seran en otra tabla


  // console.log("adaptedLotData", adaptedLotData);

  const { data, error } = await supabase.rpc("create_lots_with_stock", {
    p_lots: [lot],
    p_business_owner_id: businessOwnerId,
  });

  console.log("created lot", data);
  console.log("error creating lot", error);

  if (error) {
    console.error("Error creating lots:", error);
    throw error;
  }

  return data;
}


export const getFollowingLotNumber = async (productId: number): Promise<number> => {
  const { data, error } = await supabase
    .from("lots")
    .select("lot_number")
    .eq("product_id", productId)
    .order("lot_number", { ascending: false }) // ordenar de mayor a menor
    .limit(1)

  console.log("maxLot", data);
  console.log("error", error);

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, lo tratamos como "no hay lotes"
    throw new Error(error.message);
  }

  const lastLotNumber = data?.[0]?.lot_number ?? 0;
  return lastLotNumber + 1;
};
