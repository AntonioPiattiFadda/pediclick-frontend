import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const createStore = async (formData: any) => {
  const userId = await getBusinessOwnerId();
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

export const getStoreName = async (storeId: number | null) => {
  if (!storeId) return null;
  const { data: store, error } = await supabase
    .from("stores")
    .select("store_name")
    .eq("store_id", storeId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return store?.store_name || null;
}

export const getUserStores = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: stores, error } = await supabase
    .from("stores")
    .select("*")
    .eq("business_owner_id", businessOwnerId)
    .is("deleted_at", null);

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

export const deleteStore = async (storeId: string | number) => {
  const { data, error } = await supabase
    .from("stores")
    .update({ deleted_at: new Date() })
    .eq("store_id", storeId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
