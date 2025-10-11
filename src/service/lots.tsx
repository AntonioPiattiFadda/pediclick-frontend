import type { Lot } from "@/types/lots";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const createLot = async (lot: Lot) => {
  const businessOwnerId = await getBusinessOwnerId();
  //Desestructurar el stock_movement y el stock porque seran en otra tabla

  const adaptedLotData = {
    client_key: crypto.randomUUID(),
    expiration_date: lot.expiration_date || null,
    product_id: lot.product_id,
    expiration_date_notification: lot.expiration_date_notification,
    lot_control: lot.lot_control,
    is_sold_out: lot.is_sold_out,
    has_lot_container: lot.has_lot_container,
    is_parent_lot: lot.is_parent_lot,
    is_expired: lot.is_expired,
    // has_transport_cost: lot.has_transport_cost,    // 

    initial_stock_quantity: lot.initial_stock_quantity ?? 0,
    current_stock_quantity: lot.current_stock_quantity ?? 0,
    purchase_cost_total: lot.purchase_cost_total ?? 0,
    purchase_cost_per_unit: lot.purchase_cost_per_unit ?? 0,
    download_total_cost: lot.download_total_cost ?? 0,
    download_cost_per_unit: lot.download_cost_per_unit ?? 0,
    extra_cost_total: lot.extra_cost_total ?? 0,
    extra_cost_per_unit: lot.extra_cost_per_unit ?? 0,
    final_cost_total: lot.final_cost_total ?? 0,
    final_cost_per_unit: lot.final_cost_per_unit ?? 0,
    updated_at: new Date().toISOString(),
    lot_containers: lot.lot_containers || [],

  }

  console.log("adaptedLotData", adaptedLotData);

  const { data, error } = await supabase.rpc("create_lots_with_stock", {
    p_lots: [adaptedLotData],
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
