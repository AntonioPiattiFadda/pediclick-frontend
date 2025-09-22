import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const createSubCategory = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole();
  const { data, error } = await supabase
    .from("sub_categories")
    .insert({ sub_category_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getSubCategories = async () => {
  const businessOwnerId = await getBusinessOwnerIdByRole();
  const { data: categories, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};
