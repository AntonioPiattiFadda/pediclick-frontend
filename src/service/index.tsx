/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@supabase/supabase-js";
import { getBusinessOwnerIdByRole } from "./profiles";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

// const storageUrl =
//   "https://khpuigptjufryfxcnsrs.supabase.co/storage/v1/object/public/";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  return userId;
};

// export const getAllProducts = async () => {
//   const { data: products, error } = await supabase.from("products").select(`
//     id,
// name,
// description,
// slug,
// status,
// category_id,

//       product_images(
//       url,
//       sort_order  ),
//       product_prices(
//       quantity,
//       units(
//       name,
//       symbol),
//       price,
//       currency

//       )
//     `);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return { products, error };
// };

export const getCategories = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};

export const createCategory = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
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

export const createSubCategory = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data, error } = await supabase
    .from("sub_categories")
    .insert({ sub_category_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getSubCategories = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: categories, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
};

export const getProviders = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { providers, error };
};

export const createProvider = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data, error } = await supabase
    .from("providers")
    .insert({ provider_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getBrands = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { brands, error };
};

export const createBrand = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data, error } = await supabase
    .from("brands")
    .insert({ brand_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const fetchUnits = async () => {
  const { data: units, error } = await supabase.from("units").select(`
    id,
    name,
    symbol,
    unit_type`);

  if (error) {
    throw new Error(error.message);
  }

  return units;
};

// export const getProductById = async (id: number) => {
//   const { data: products, error } = await supabase
//     .from("products")
//     .select(
//       `
//         *,
//         unit_prices (
//           *
//         )
//       `
//     )
//     .eq("id", id);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return products;
// };

export const createProduct = async (product: any) => {
  const { lots, ...productWithoutLots } = product;

  console.log("Creating product with lots:", productWithoutLots);

  const { data: newLots, error: lotsError } = await supabase
    .from("lots")
    .insert(lots)
    .select();

  if (lotsError) {
    console.error("lotsError", lotsError);
    throw new Error("Error al crear los lotes");
  }

  const { data: newProduct, error: productError } = await supabase
    .from("products")
    .insert({
      ...productWithoutLots,
    })
    .select()
    .single();

  if (productError) {
    console.error("productError", productError);
    throw new Error("Error al crear el producto");
  }

  const productLots = newLots.map((lot: any) => ({
    product_id: newProduct.product_id,
    lot_id: lot.lot_id,
  }));

  const { error: productLotsError } = await supabase
    .from("product_lots")
    .insert(productLots);

  if (productLotsError) {
    console.error("productLotsError", productLotsError);
    throw new Error("Error al crear relaciones producto-lote");
  }

  return {
    ...newProduct,
    lots: newLots,
  };
};

export const deleteProduct = async (productId: string | number) => {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date() })
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

//  export const uploadImage = async (file) => {
//    const { data, error } = await supabase.storage
//      .from("PediClick-panarce")
//      .upload(file.name, file);

//    if (error) {
//      throw new Error(error.message);
//    }

//    return data;
//  };

// export const getProductById = async (id) => {
//   let { data: products, error } = await supabase
//     .from("products")
//     .select(
//       `
//     id,
// name,
// description,
// slug,
// status,
// category_id,

//       product_images(
//       url,
//       sort_order  ),
//       product_prices(
//       quantity,
//       units(
//       name,
//       symbol),
//       price,
//       currency

//       )
//     `
//     )
//     .eq("id", id);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return products;
// };

export const uploadImage = async (file: File) => {
  const { data, error } = await supabase.storage
    .from("PediClick-panarce")
    .upload(file.name, file);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getSaleUnits = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: saleUnits, error } = await supabase
    .from("sale_units")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  const { data: publicUnits, error: publicUnitError } = await supabase
    .from("sale_units")
    .select("*")
    .is("business_owner_id", null);

  if (error || publicUnitError) {
    throw new Error(
      error?.message || publicUnitError?.message || "Unknown error"
    );
  }

  return { saleUnits: [...(saleUnits ?? []), ...(publicUnits ?? [])], error };
};

export const createSaleUnit = async (name: string, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: saleUnits, error } = await supabase
    .from("sale_units")
    .insert({ sale_unit_name: name, business_owner_id: businessOwnerId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return saleUnits;
};
