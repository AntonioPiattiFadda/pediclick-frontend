import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getBrands = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { brands, error };
};

export const createBrand = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("brands")
    .insert({ brand_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
