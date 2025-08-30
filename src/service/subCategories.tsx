import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const createSubCategory = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
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

export const getSubCategories = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: categories, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};