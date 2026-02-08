import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getLotContainers = async () => {
  const organizationId = await getOrganizationId();
  const { data: lotContainers, error } = await supabase
    .from("lot_containers")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return { lotContainers, error };
};

export const getLotContainersLocation = async () => {
  const organizationId = await getOrganizationId();

  const { data, error } = await supabase
    .from("lot_containers_location")
    .select(
      `*`
    )
    .eq("organization_id", organizationId);
  // stores(store_name),
  // categories(category_name),
  // sub_categories(sub_category_name),
  // brands(brand_name)


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adaptedLotContainersLocation = data?.map((loc: any) => ({
    ...loc,
    store_name: loc.store_name?.store_name ?? null,
    stock_room_name: loc.stock_room_name?.stock_room_name ?? null,
    client_name: loc.client_name?.full_name ?? null,
    provider_name: loc.provider_name?.provider_name ?? null
  }));


  if (error) {
    throw new Error(error.message);
  }

  return { lotContainersStock: adaptedLotContainersLocation, error };
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
  lot_container_name: string,
  lot_container_price: number | null,
) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("lot_containers")
    .insert({
      lot_container_name,
      lot_container_price,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};


