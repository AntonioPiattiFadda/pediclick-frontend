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

export const getLotContainersLocation = async () => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: lotContainersLocation, error } = await supabase
    .from("lot_containers_location")
    .select("*")
    .eq("business_owner_id", businessOwnerId);

  if (error) {
    throw new Error(error.message);
  }

  return { lotContainersLocation, error };
};

export const getLotContainersMovements = async (lotContainerId: number) => {
  const { data: lotContainersMovements, error } = await supabase
    .from("lot_containers_movements")
    .select("*")
    .eq("lot_container_id", lotContainerId);

  if (error) {
    throw new Error(error.message);
  }

  return { lotContainersMovements, error };
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
