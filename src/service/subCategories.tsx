import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const createSubCategory = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerId();
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
  const businessOwnerId = await getBusinessOwnerId();
  const { data: categories, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};

export const updateSubCategory = async (subCategoryId: number, updates: Partial<{ sub_category_name: string, description: string; image_url: string; }>) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data, error } = await supabase
    .from("sub_categories")
    .update({
      ...updates,
      business_owner_id: businessOwnerId, 
    })
    .eq("sub_category_id", subCategoryId)
    .eq("business_owner_id", businessOwnerId) 
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};