import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getProviders = async () => {
  const organizationId = await getOrganizationId();
  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .is("deleted_at", null) // Exclude soft-deleted providers
    .eq("organization_id", organizationId);


  if (error) {
    throw new Error(error.message);
  }

  return { providers, error };
};

export const createProvider = async (name: string, shortCode: string) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("providers")
    .insert({ provider_name: name, short_code: shortCode, organization_id: organizationId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteProvider = async (id: string | number) => {
  const { error } = await supabase
    .from("providers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("provider_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

