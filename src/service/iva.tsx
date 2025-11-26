import type { Iva } from "@/types/iva";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";


export const getIva = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: ivas, error } = await supabase
    .from("iva")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { ivas, error };
};

export const createIva = async (iva: Iva) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("iva")
    .insert({ iva_number: iva.iva_number, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
