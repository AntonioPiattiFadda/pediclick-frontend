import { adaptProductsForClient } from "@/adapters/products";
import type { Product } from "@/types";
import { supabase } from ".";

export const getAllProducts = async () => {
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(
      `
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name),
      providers(provider_name),
      sale_units(sale_unit_name),
      product_lots (
        lots (*)
      )
    `
    )
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const products = adaptProductsForClient(dbProducts);

  return { products, error };
};

export const getProduct = async (productId: number) => {
  const { data: dbProduct, error } = await supabase
    .from("products")
    .select(
      `
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name),
      sale_units(sale_unit_name),
      product_lots (
        lots (*)
      )
    `
    )
    .eq("product_id", productId)
    .single();

  if (error) {
    console.log("getProduct error", error);
    throw new Error(error.message);
  }
  console.log("XAtaptar");

  const product = adaptProductsForClient([dbProduct])[0];

  console.log("adaptedProductSingle", product);

  return { product, error };
};

export const updateProduct = async (
  productId: number,
  productData: Partial<Product>
) => {
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};
