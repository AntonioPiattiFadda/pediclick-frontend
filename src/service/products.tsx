import { adaptProductsForClient } from "@/adapters/products";
import type { Product } from "@/types/products";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getAllProducts = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: dbProducts, error } = await supabase
    .rpc("get_products_with_available_lots", {
      p_business_owner_id: businessOwnerId,
    });


  console.log("dbProducts", dbProducts, error);

  if (error) {
    throw new Error(error.message);
  }


  const products = adaptProductsForClient(dbProducts);
  console.log("adaptedProducts", products);


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
      lots(*)
        `
    )
    .eq("product_id", productId)
    .single();

  if (error) {
    console.log("getProduct error", error);
    throw new Error(error.message);
  }
  console.log("XAtaptar", dbProduct);

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

  console.log("updateProduct", data, error);

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

export const createProduct = async (product: Product) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: newProduct, error: productError } = await supabase
    .from("products")
    .insert({
      business_owner_id: businessOwnerId,
      ...product,
    })
    .select()
    .single();

  if (productError) {
    console.error("productError", productError);
    throw new Error("Error al crear el producto");
  }

  return {
    ...newProduct,
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

export const getProductsByShortCode = async (
  shortCode: string
) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: dbProducts, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .eq("business_owner_id", businessOwnerId)
    .order("product_name", { ascending: true })
    .eq("short_code", shortCode);

  // .ilike("short_code", `%${shortCode}%`);

  console.log(dbProducts, error);

  if (error) throw new Error(error.message);

  const products = adaptProductsForClient(dbProducts || []);
  return { products, error: null };
};

// function escapeLike(s: string) {
//   // evita que % y _ rompan el patrón ILIKE
//   return s.replace(/[%_]/g, (m) => `\\${m}`);
// }

export const getProductsByName = async (name: string) => {
  const businessOwnerId = await getBusinessOwnerId();

  const q = name.trim();
  const isNumeric = /^\d+$/.test(q);
  // const safe = escapeLike(q);

  if (isNumeric) {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(
        `
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name)
        `
      )
      .is("deleted_at", null)
      .eq("business_owner_id", businessOwnerId)
      .eq("short_code", parseInt(q))
      .order("product_name", { ascending: true })
      .limit(10);


    if (error) throw new Error(error.message);

    const products = adaptProductsForClient(dbProducts || []);
    return { products, error: null };
  }

  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(
      `*,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name)
        `
    )
    .is("deleted_at", null)
    .eq("business_owner_id", businessOwnerId)
    .ilike("product_name", `%${name}%`)
    .order("product_name", { ascending: true })
    .limit(10);



  if (error) throw new Error(error.message);

  const products = adaptProductsForClient(dbProducts || []);
  return { products, error: null };
};

export const checkIfShortCodeIsAvailable = async (
  shortCode: number,
  productId?: number
) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data, error } = await supabase.rpc('get_products_stock_status_by_short_code', {
    p_short_code: shortCode,
    p_business_owner_id: businessOwnerId,
  });

  console.log("checkIfShortCodeIsAvailable", { data, error });

  if (error) {
    console.error("checkIfShortCodeIsAvailable RPC error", error);
    throw new Error(error.message);
  }

  const filteredProducts = data ? data.filter((p: {
    product_id: number;
    product_name: string;
    is_sold_out: boolean;
  }) => p.product_id !== productId) : [];

  const isAvailable = filteredProducts.length === 0 || filteredProducts === null;

  return {
    isAvailable, products: filteredProducts
  };
};