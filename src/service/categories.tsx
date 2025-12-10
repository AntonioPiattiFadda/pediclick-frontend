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


export const updateCategory = async (categoryId: number, updates: Partial<{ category_name: string; description: string; image_url: string; }>) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data, error } = await supabase
    .from("categories")
    .update({
      ...updates,
      business_owner_id: businessOwnerId, 
    })
    .eq("category_id", categoryId)
    .eq("business_owner_id", businessOwnerId) 
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};