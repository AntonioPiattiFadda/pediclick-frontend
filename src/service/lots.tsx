import type { Lot } from "@/types/lots";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Stock } from "@/types/stocks";

export const createLot = async (lot: Lot, stock: Stock[], lotContainersStock: LotContainersStock[]) => {
  const businessOwnerId = await getBusinessOwnerId();

  alert('casd')

  console.log("Creating lot with data:", { lot, stock, lotContainersStock, businessOwnerId });

  const { data, error } = await supabase.rpc("add_stock", {
    p_lot: lot,
    p_stocks: stock,
    p_lot_containers_location: lotContainersStock,
    p_business_owner_id: businessOwnerId,
  });


  if (error) {
    console.error("Error creating lot:", error);
    throw error;
  }

  return data;
};

export const getFollowingLotNumber = async (productId: number): Promise<number> => {
  const { data, error } = await supabase
    .from("lots")
    .select("lot_number")
    .eq("product_id", productId)
    .order("lot_number", { ascending: false }) // ordenar de mayor a menor
    .limit(1)

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, lo tratamos como "no hay lotes"
    throw new Error(error.message);
  }

  const lastLotNumber = data?.[0]?.lot_number ?? 0;
  return lastLotNumber + 1;
};
