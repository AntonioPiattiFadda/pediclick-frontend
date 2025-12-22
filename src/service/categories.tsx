import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getCategories = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};

export const createCategory = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("categories")
    .insert({ category_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getCategoriesCount = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("category_id")
    .eq("business_owner_id", businessOwnerId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  return categories.length;
};