import { handleSupabaseError } from "@/utils/handleSupabaseErrors";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";
import type { SubapaseConstrains } from "@/types/shared";
import type { SellType } from "@/types";

export const entityConstraints: SubapaseConstrains[] = [{
  value: "unique_shortcode_per_owner",
  errorMsg: "El código corto ya está en uso para otra presentación de producto.",
},
{
  value: "unique_presentation_per_owner_and_product",
  errorMsg: "Ya existe una presentación con ese nombre para este producto.",
}
];


// Difieren en la app escritorio y esta.
export const getProductPresentations = async (
  productId: number | null,
  isFetchWithLots: boolean = false,
  isFetchedWithLotContainersLocation: boolean = false,
  locationId: number | null = null
) => {


  if (!productId) {
    return { presentations: [], error: null };
  }

  const organizationId = await getOrganizationId();

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
          final_cost_per_unit,
          final_cost_per_bulk,
          final_cost_total,
          stock!inner(lot_id,
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
      : `
        product_presentation_id,
        product_presentation_name,
        short_code,
        bulk_quantity_equivalence,
        prices(*),
        lots(lot_id,
          created_at,
          is_sold_out,
          final_cost_per_unit,
          final_cost_per_bulk,
          final_cost_total,
          stock!inner(lot_id,
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
    : `
        *,
        prices(*)
      `;

  const query = supabase
    .from("product_presentations")
    .select(lotsSelect)
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .eq("product_id", productId);


  if (isFetchWithLots) {
    console.log("isFetchWithLots", isFetchWithLots);
    query.gt("lots.stock.quantity", 0);
  }
  if (locationId) {
    console.log("locationId", locationId);
    query.eq("lots.stock.location_id", Number(locationId));
  }
  const { data: presentations, error } = await query;

  // if (locationId) {
  //   presentations?.forEach((presentation) => {
  //     presentation?.lots = presentation.lots?.map((lot) => {
  //       const filteredStock = lot.stock?.filter((stock) => Number(stock.location_id) === locationId);
  //       return {
  //         ...lot,
  //         stock: filteredStock,
  //       };
  //     }) || [];
  //   });
  // }
  console.log("Fetched presentations:", presentations, error);

  if (error) throw new Error(error.message);

  return presentations;
};


export const getProductPresentation = async (productPresentationId: number | null) => {
  const organizationId = await getOrganizationId();
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
    .eq("organization_id", organizationId)
    .eq("product_presentation_id", productPresentationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { presentation, error };
};

export const createProductPresentation = async (name: string, shortCode: number | null, productId: number, bulkQuantityEquivalence: number | null, sellType: SellType) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("product_presentations")
    .insert({ product_presentation_name: name, short_code: shortCode, organization_id: organizationId, product_id: productId, bulk_quantity_equivalence: bulkQuantityEquivalence, sell_type: sellType })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, entityConstraints);
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

