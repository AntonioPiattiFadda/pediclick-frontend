import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getCategories = async () => {
  const organizationId = await getOrganizationId();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};

export const createCategory = async (name: string) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("categories")
    .insert({ category_name: name, organization_id: organizationId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getCategoriesCount = async () => {
  const organizationId = await getOrganizationId();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("category_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  return categories.length;
};