import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getLotContainers = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: lotContainers, error } = await supabase
    .from("lot_containers")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { lotContainers, error };
};

export const createLotContainer = async (
  {
    lot_container_name,
    lot_container_price,
  }: {
    lot_container_name: string;
    lot_container_price: string;
  }
) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("lot_containers")
    .insert({
      lot_container_name,
      lot_container_price,
      business_owner_id: businessOwnerId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
