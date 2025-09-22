import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getProviders = async () => {
  const businessOwnerId = await getBusinessOwnerIdByRole();
  console.log("Business Owner ID:", businessOwnerId); // Debug log
  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { providers, error };
};

export const createProvider = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole();
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
