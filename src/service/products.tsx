import { adaptProductsForClient } from "@/adapters/products";
import { supabase } from ".";
import type { Product, ProductLot } from "@/types/products";

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

export const createProduct = async (product: Product) => {
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

  const productLots = newLots.map((lot: ProductLot) => ({
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

export const getProductsByShortCode = async (shortCode: string) => {
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(`
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name),
      sale_units(sale_unit_name),
      product_lots ( lots(*) )
    `)
    // .is("deleted_at", null) // descomenta si usás borrado lógico
    .ilike("short_code", `%${shortCode}%`)
    .order("product_name", { ascending: true })

  if (error) throw new Error(error.message)

  const products = adaptProductsForClient(dbProducts || [])
  return { products, error: null }
}

export const getProductsByName = async (name: string) => {
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(`
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name),
      sale_units(sale_unit_name),
      product_lots ( lots(*) )
    `)
    // .is("deleted_at", null)
    .ilike("product_name", `%${name}%`)
    .order("product_name", { ascending: true })

  if (error) throw new Error(error.message)

  const products = adaptProductsForClient(dbProducts || [])
  return { products, error: null }
}