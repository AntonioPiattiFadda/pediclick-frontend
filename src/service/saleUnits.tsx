// import { supabase } from ".";
// import { getBusinessOwnerId } from "./profiles";

// export const getSaleUnits = async (userRole: string) => {
//   const businessOwnerId = await getBusinessOwnerId(userRole);
//   const { data: saleUnits, error } = await supabase
//     .from("sale_units")
//     .select("*")
//     .eq("business_owner_id", businessOwnerId);

//   const { data: publicUnits, error: publicUnitError } = await supabase
//     .from("sale_units")
//     .select("*")
//     .is("business_owner_id", null);

//   if (error || publicUnitError) {
//     throw new Error(
//       error?.message || publicUnitError?.message || "Unknown error"
//     );
//   }

//   return { saleUnits: [...(saleUnits ?? []), ...(publicUnits ?? [])], error };
// };

// export const createSaleUnit = async (name: string) => {
//   const businessOwnerId = await getBusinessOwnerId();
//   const { data: saleUnits, error } = await supabase
//     .from("sale_units")
//     .insert({ sale_unit_name: name, business_owner_id: businessOwnerId })
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
