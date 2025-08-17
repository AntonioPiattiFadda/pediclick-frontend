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