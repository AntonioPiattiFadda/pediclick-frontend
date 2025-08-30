import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getProviders = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { providers, error };
};

export const createProvider = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data, error } = await supabase
    .from("providers")
    .insert({ provider_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
