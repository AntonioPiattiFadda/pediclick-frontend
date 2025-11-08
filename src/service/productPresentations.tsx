import { handleSupabaseError } from "@/utils/handleSupabaseErrors";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { SubapaseConstrains } from "@/types/shared";



export const productPresentationConstraints: SubapaseConstrains[] = [{
  value: "unique_shortcode_per_owner",
  errorMsg: "El código corto ya está en uso para otra presentación de producto.",
},
{
  value: "unique_presentation_per_owner_and_product",
  errorMsg: "Ya existe una presentación con ese nombre para este producto.",
}

];



export const getProductPresentations = async (productId: number | null) => {
  const businessOwnerId = await getBusinessOwnerId();
  console.log("Business Owner ID:", businessOwnerId); // Debug log
  const { data: presentations, error } = await supabase
    .from("product_presentations")
    .select("*")
    .is("deleted_at", null) // Exclude soft-deleted providers
    .eq("business_owner_id", businessOwnerId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return { presentations, error };
};

export const createProductPresentation = async (name: string, shortCode: string, productId: number) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("product_presentations")
    .insert({ product_presentation_name: name, short_code: shortCode, business_owner_id: businessOwnerId, product_id: productId })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, productPresentationConstraints);
    // throw new Error(error.message);
  }

  return data;

};

export const deleteProductPresentation = async (id: string | number) => {
  const { error } = await supabase
    .from("product_presentations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("product_presentation_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

