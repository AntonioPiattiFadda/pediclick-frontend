import { getUserId, supabase } from ".";

/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const getStoreByStoreId = async (storeId: string | number) => {
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("store_id", storeId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { store, error };
};

export const editStore = async (storeId: string | number, formData: any) => {
  const { data, error } = await supabase
    .from("stores")
    .update(formData)
    .eq("store_id", storeId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
