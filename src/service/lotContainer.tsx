import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getLotContainers = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
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
  },
  userRole: string
) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
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
