import type { Lot } from "@/types/lots";
import { supabase } from ".";

export const createLot = async (lot: Lot) => {
  //Desestructurar el stock_movement y el stock porque seran en otra tabla

  const { stock_movement, stock, ...lotData } = lot;

  console.log("lotData", lotData);

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
