// import { supabase } from ".";
// import { getOrganizationId } from "./profiles";

// export const getSaleUnits = async (userRole: string) => {
//   const organizationId = await getOrganizationId(userRole);
//   const { data: saleUnits, error } = await supabase
//     .from("sale_units")
//     .select("*")
//     .eq("organization_id", organizationId);

//   const { data: publicUnits, error: publicUnitError } = await supabase
//     .from("sale_units")
//     .select("*")
//     .is("organization_id", null);

//   if (error || publicUnitError) {
//     throw new Error(
//       error?.message || publicUnitError?.message || "Unknown error"
//     );
//   }

//   return { saleUnits: [...(saleUnits ?? []), ...(publicUnits ?? [])], error };
// };

// export const createSaleUnit = async (name: string) => {
//   const organizationId = await getOrganizationId();
//   const { data: saleUnits, error } = await supabase
//     .from("sale_units")
//     .insert({ sale_unit_name: name, organization_id: organizationId })
//     .select()
//     .single();

//   if (error) {
//     throw new Error(error.message);
//   }

//   return saleUnits;
// };

// export const fetchUnits = async () => {
//   const { data: units, error } = await supabase.from("units").select(`
//     id,
//     name,
//     symbol,
//     unit_type`);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return units;
// };
