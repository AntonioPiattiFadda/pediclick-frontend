import { supabase } from ".";

export const getAllProducts = async () => {
  const { data: products, error } = await supabase.from("products").select(`
    id,
name,
description,
slug,
status,
category_id,

      product_images(
      url,
      sort_order  ),
      product_prices(
      quantity,
      units(
      name,
      symbol),
      price,
      currency

      )
    `);

  if (error) {
    throw new Error(error.message);
  }

  return { products, error };
};