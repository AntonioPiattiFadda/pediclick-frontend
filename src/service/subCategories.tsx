import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const createSubCategory = async (name: string) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("sub_categories")
    .insert({ sub_category_name: name, organization_id: organizationId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getSubCategories = async () => {
  const organizationId = await getOrganizationId();
  const { data: categories, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};
