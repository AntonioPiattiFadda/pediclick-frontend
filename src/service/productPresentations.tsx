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



export const getProductPresentations = async (
  productId: number | null,
  isFetchWithLots: boolean = false,
  isFetchedWithLotContainersLocation: boolean = false
) => {
  const businessOwnerId = await getBusinessOwnerId();

  const lotsSelect = isFetchWithLots
    ? isFetchedWithLotContainersLocation
      ? `
        product_presentation_id,
        product_presentation_name,
        short_code,
        bulk_quantity_equivalence,
        lots(lot_id,
          created_at,
          is_sold_out,
          stock(*,
            lot_containers_stock(*)
          )
        )
        
      `
      : `
        *,
        lots(
          *,
          stock(lot_id,
            quantity,
            stock_id,
            location_id,
            stock_type,
            reserved_for_transferring_quantity,
            reserved_for_selling_quantity,
            lot_containers_stock(*)
            )
        )
      `
    : "*";

  // lot_id: 189,
  //   quantity: 2,
  //     stock_id: 178,
  //       created_at: '2025-11-27T01:48:48.444488+00:00',
  //         product_id: 117,
  //           stock_type: null,
  //             updated_at: '2025-11-27T01:48:48.444488+00:00',
  //               location_id: 3,
  //                 max_notification: null,
  //                   min_notification: null,
  //                     lot_containers_stock: [],
  //                       transformed_to_product_id: null,
  //                         transformed_from_product_id: null,
  //                           reserved_for_selling_quantity: null,
  //                             reserved_for_transferring_quantity: null

  let query = supabase
    .from("product_presentations")
    .select(lotsSelect)
    .is("deleted_at", null)
    .eq("business_owner_id", businessOwnerId)
    .eq("product_id", productId);

  // if (isFetchWithLots) {
  //   query = query.eq("lots.stock.current_quantity", 0);
  // }

  const { data: presentations, error } = await query;

  console.log("Presentations fetched:", presentations, error);

  if (error) throw new Error(error.message);

  return { presentations, error };
};


export const getProductPresentation = async (productPresentationId: number | null) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: presentation, error } = await supabase
    .from("product_presentations")
    .select(`
      *,
      products(product_name),
      lots(*
      , stock(*)
      )
        `)
    .is("deleted_at", null) // Exclude soft-deleted providers
    .eq("business_owner_id", businessOwnerId)
    .eq("product_presentation_id", productPresentationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { presentation, error };
};

export const createProductPresentation = async (name: string, shortCode: number | null, productId: number, bulkQuantityEquivalence: number | null) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("product_presentations")
    .insert({ product_presentation_name: name, short_code: shortCode, business_owner_id: businessOwnerId, product_id: productId, bulk_quantity_equivalence: bulkQuantityEquivalence })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, productPresentationConstraints);
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

