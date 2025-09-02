import type { Lot } from "@/types/lots";
import { supabase } from ".";

export const createLot = async (lot: Lot) => {
  const { data: newLot, error: lotsError } = await supabase
    .from("lots")
    .insert(lot)
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
