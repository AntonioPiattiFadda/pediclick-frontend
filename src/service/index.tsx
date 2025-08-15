/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
} from "@/utils/localStorageUtils";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

const storageUrl =
  "https://khpuigptjufryfxcnsrs.supabase.co/storage/v1/object/public/";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key in environment variables");
}

export const insertNewAdminUser = async (email: string, userUid: string) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      role: "OWNER",
      id: userUid,
    })
    .select()
    .single();

  console.log("createNewAdminUser data:", data, "error:", error);

  if (error) {
    return { error };
  }

  return { data };
};

// export const insertNewTeamMemberUser = async (
//   email: string,
//   role: string,
//   userUid: string
// ) => {
//   const { data, error } = await supabase
//     .from("users")
//     .insert({
//       email,
//       role,
//       id: userUid,
//     })
//     .select()
//     .single();

//   if (error) {
//     return { error };
//   }

//   return { data };
// };

const checkUserExists = async (email: string) => {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  return { userExists: data !== null };
};

export async function createNewUser(email: string, password: string) {
  try {
    const { userExists } = await checkUserExists(email);

    if (userExists) {
      const error = new Error("");
      error.message = "El email ya está en uso";
      error.name = "ConflictError";
      throw error;
    }

    const {
      data: { session: adminSession },
    } = await supabase.auth.getSession();

    if (!adminSession) {
      const error = new Error("");
      error.message =
        "No hay sesión activa de administrador, intenta hacer el login nuevamente";
      throw error;
    }

    const authSessionStorage = {
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    };

    setLocalStorage("authSession", authSessionStorage);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    interface AuthSession {
      access_token: string;
      refresh_token: string;
    }

    const authSession = getLocalStorage("authSession") as AuthSession | null;
    removeLocalStorage("authSession");

    if (
      authSession &&
      typeof authSession.access_token === "string" &&
      typeof authSession.refresh_token === "string"
    ) {
      try {
        await supabase.auth.setSession({
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token,
        });
      } catch (error) {
        console.error("Error restoring admin session:", error);
      }
    }

    if (error) {
      return {
        error: error,
        data: null,
      };
    }

    if (!data.user) {
      return {
        error: { message: "No se pudo crear el usuario." },
        data: null,
      };
    }

    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    console.error("Error creating new user:", error);
    throw error;
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  return userId;
};

export const getUserStores = async () => {
  const userId = await getUserId();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("*")
    .eq("business_owner_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return { stores, error };
};

const getBusinessOwnerId = async (storeId: number) => {
    const { data: store, error } = await supabase
      .from("stores")
      .select("business_owner_id")
      .eq("store_id", storeId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return store?.business_owner_id;
  };

export const getUserTeamMembers = async (storeId: number) => {
  const businessOwnerId = await getBusinessOwnerId(storeId);

  const { data: teamMembers, error } = await supabase
    .from("users")
    .select("*")
    .eq("parent_user_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { teamMembers, error };
};

export const createTeamMember = async (newUserData: any) => {
  const userId = await getUserId();

  const { error: createUserError, data: user } = await createNewUser(
    newUserData.email,
    newUserData.password
  );

  const newUserUID = user?.id;

  if (createUserError) {
    const error = new Error("");
    error.message = createUserError.message;
    throw error;
  }

  const newUserDataFormatted = {
    id: newUserUID,
    email: newUserData.email,
    role: newUserData.role,
    full_name: newUserData.full_name,
    avatar_url: newUserData.avatar_url,
    address: newUserData.address,
    phone: newUserData.phone,
    is_verified: false,
    store_id: newUserData.store_id,
    parent_user_id: userId,
  };

  const { data, error: newUserError } = await supabase
    .from("users")
    .insert({
      ...newUserDataFormatted,
    })
    .select()
    .single();

  if (newUserError) {
    const error = new Error("");
    error.message = newUserError.message;
    throw error;
  }

  return { data, newUserError };
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

//SECTION Stores

export const createStore = async (formData: any) => {
  const userId = await getUserId();
  const formattedStore = {
    ...formData,
    business_owner_id: userId,
  };
  const { data, error } = await supabase
    .from("stores")
    .insert(formattedStore)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
