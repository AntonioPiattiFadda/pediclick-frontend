import type { Iva } from "@/types/iva";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";


export const getIva = async () => {
  const organizationId = await getOrganizationId();
  const { data: ivas, error } = await supabase
    .from("iva")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return { ivas, error };
};

export const createIva = async (iva: Iva) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("iva")
    .insert({ iva_number: iva.iva_number, organization_id: organizationId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
