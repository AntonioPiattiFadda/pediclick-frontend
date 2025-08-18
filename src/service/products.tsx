import { supabase } from ".";

export const getAllProducts = async () => {
  const { data: products, error } = await supabase.from("products").select(`
    product_id,
    product_name,
    description,
    slug,
    status,
    category_id,
    product_images(
      url,
      sort_order
    ),
     product_prices(
       quantity,
       price,
       currency,
       units(
         name,
         symbol
       )
     )
  `);

  if (error) {
    throw new Error(error.message);
  }

  return { products, error };
};
