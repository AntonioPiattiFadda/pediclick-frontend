/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

const storageUrl =
  "https://khpuigptjufryfxcnsrs.supabase.co/storage/v1/object/public/";

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

export const getCategories = async () => {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return { categories, error };
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

export const createProduct = async (product: any, prices: any, images: any) => {
  const userId = await getUserId();
  const newProductForDb = {
    ...product,
    seller_id: userId,
  };

  const { data: newProduct, error: productError } = await supabase
    .from("products")
    .insert(newProductForDb)
    .select()
    .single();

  if (productError) {
    console.log("productError", productError);
    throw new Error("Error al crear el producto");
  }

  const newProductPricesForDb = prices.map((price: any) => ({
    ...price,
    product_id: newProduct.id, // Asegúrate de que el id del producto esté disponible
  }));

  console.log("newProductPricesForDb", newProductPricesForDb);

  const { error: pricesError } = await supabase
    .from("product_prices")
    .insert(newProductPricesForDb)
    .select();

  if (pricesError) {
    console.log("pricesError", pricesError);
    throw new Error("Error al crear los precios del producto");
  }

  //Primero cargar las imagense en el storage de supabase
  const imageUploads = await Promise.all(
    images.map(async (image: any) => {
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(`${userId}/products/${newProduct.id}/${image.name}`, image);

      console.log("data", data, error);
      if (error) throw new Error("Error al subir la imagen del producto");
      return {
        url: `${storageUrl}${data.fullPath}`, // Asegúrate de que este sea el campo correcto para la URL
      };
    })
  );

  console.log("imageUploads", imageUploads);

  const { data: newProductImages, error: imagesError } = await supabase
    .from("product_images")
    .insert(
      imageUploads.map((image) => ({
        ...image,
        product_id: newProduct.id, // Asegúrate de que el id del producto esté disponible
      }))
    )
    .select();

  console.log("newProductImages", newProductImages, imagesError);

  //   const { data: images, error: imagesError } = await supabase
  //     .from("product_images")
  //     .insert(
  //       productData.product_images.map((image) => ({
  //         ...image,
  //         product_id: product.id,
  //       }))
  //     )
  //     .select();

  //   if (imagesError) throw new Error("Error al crear las imágenes del producto");

  //   return { product, prices, images };
};

export const deleteProduct = async (productId: string | number) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

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
