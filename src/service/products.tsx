import { adaptProductsForClient } from "@/adapters/products";
import type { Product } from "@/types/products";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getAllProducts = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(`
  product_id,
  product_name,
  short_code,
  category_id,
  sub_category_id,
  public_images(public_image_src),
  categories(category_name),
  sub_categories(sub_category_name),
  brands(brand_name),
  product_presentations!inner (
    product_presentation_id,
    product_presentation_name,
    bulk_quantity_equivalence,
    lots(
      lot_id,
      created_at,
      is_sold_out,
      expiration_date,
      stock(
        *,
        locations(name),
        lot_containers_stock(*)
      )
    )
  )
`)
    .is("product_presentations.deleted_at", null)
    .is("deleted_at", null)
    .eq("business_owner_id", businessOwnerId)
    .order("product_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  console.log("dbProducts", dbProducts);

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
      lots(
        *,
        stock(*)
      )
      `
    )
    .eq("product_id", productId)
    .is("deleted_at", null) // ✅ Solo productos activos
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const product = adaptProductsForClient([dbProduct])[0];


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


  if (error) throw new Error(error.message);

  const products = adaptProductsForClient(dbProducts || []);
  return { products, error: null };
};

// function escapeLike(s: string) {
//   // evita que % y _ rompan el patrón ILIKE
//   return s.replace(/[%_]/g, (m) => `\\${m}`);
// }

export const getProductsByName = async (name: string, withLots: boolean) => {
  const businessOwnerId = await getBusinessOwnerId();

  const q = name.trim();
  const isNumeric = /^\d+$/.test(q);

  // Base de la consulta
  let query = supabase
    .from("products")
    .select(`
    product_id,
    product_name,
    short_code,
    updated_at,
    public_images(public_image_src)
    ${withLots ? ", lots(lot_id,created_at, stock(stock_id, quantity))" : ""}
  `)
    .is("deleted_at", null)
    .eq("business_owner_id", businessOwnerId)
    .order("product_name", { ascending: true })
    .limit(2);


  if (withLots) {
    query = query.eq("lots.is_sold_out", false);
  }

  // Condición según tipo de búsqueda
  if (isNumeric) {
    query = query.eq("short_code", parseInt(q));
  } else {
    query = query.ilike("product_name", `%${q}%`);
  }

  // Ejecutar la consulta
  const { data: dbProducts, error } = await query;

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

export const getProductCountByCategory = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: products, error } = await supabase
    .from("products")
    .select("category_id")
    .eq("business_owner_id", businessOwnerId)
    .is("deleted_at", null);

  console.log(products?.length);

  if (error) throw new Error(error.message);

  const aggregated: Record<string, number> = {};

  products.forEach((product) => {
    const categoryId = product.category_id ?? "uncategorized"; // <--- important
    aggregated[categoryId] = (aggregated[categoryId] || 0) + 1;
  });

  // 2) Traer categorías
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("category_id, category_name")
    .eq("business_owner_id", businessOwnerId)
    .is("deleted_at", null);

  if (categoriesError) throw new Error(categoriesError.message);

  const colors = [
    "hsl(214, 95%, 68%)",
    "hsl(354, 70%, 54%)",
    "hsl(134, 61%, 51%)",
    "hsl(24, 95%, 54%)",
    "hsl(271, 76%, 53%)",
    "hsl(22, 94%, 50%)",
    "hsl(47, 95%, 54%)",
  ];

  const result = [
    ...categories.map((cat, index) => ({
      category_id: cat.category_id,
      name: cat.category_name,
      count: aggregated[cat.category_id] || 0,
      color: colors[index + 1],
    })),

    {
      category_id: null,
      name: "Sin categoría",
      count: aggregated["uncategorized"] || 0,
      color: colors[0],
    },
  ];

  console.log(result);

  return result;
};
