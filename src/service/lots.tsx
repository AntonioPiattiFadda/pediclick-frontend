import type { Lot } from "@/types/lots";
import { supabase } from ".";

export const createLot = async (lot: Lot) => {
  //Desestructurar el stock_movement y el stock porque seran en otra tabla

  const { ...lotData } = lot;

  console.log("lotData", lotData);
  alert("Creando lote...");

  const { data: newLot, error: lotsError } = await supabase
    .from("lots")
    .insert(lotData)
    .select();

  if (lotsError) {
    console.error("lotsError", lotsError);
    throw new Error("Error al crear los lotes");
  }

  // Crear la tabla intermedia para asociar al producto

  return {
    ...newLot,
  };
};


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
