import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getBrands = async () => {
  const organizationId = await getOrganizationId();
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return { brands, error };
};

export const createBrand = async (name: string) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("brands")
    .insert({ brand_name: name, organization_id: organizationId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};


export const updateBrand = async (brandId: number, updates: Partial<{ brand_name: string }>) => {
  const organizationId = await getOrganizationId();

  const { data, error } = await supabase
    .from("brands")
    .update({
      ...updates,
      organization_id: organizationId,
    })
    .eq("brand_id", brandId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};