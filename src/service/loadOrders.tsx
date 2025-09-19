// import type { LoadOrder } from "@/types";
import type { LoadOrder } from "@/types/loadOrders";
import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";

// const mockLoadOrders: LoadOrder[] = [
//   {
//     id: "1",
//     order_number: "LO-001",
//     status: "pending",
//     created_at: "2025-08-29T10:00:00Z",
//   },
//   {
//     id: "2",
//     order_number: "LO-002",
//     status: "completed",
//     created_at: "2025-08-27T15:30:00Z",
//   },
// ];

export const getAllLoadOrders = async (userRole: string) => {
  console.log("getAllLoadOrders called with userRole:", userRole);
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  console.log("getAllLoadOrders - businessOwnerId:", businessOwnerId);
  const { data: dbLoadOrders, error } = await supabase
    .from("load_orders")
    .select(
      `*,
      providers(provider_name)
        `
    )
    .eq("business_owner_id", businessOwnerId);


  if (error) {
    throw new Error(error.message);
  }

  return { dbLoadOrders, error: null };
};

export const createLoadOrder = async (
  userRole: string,
  loadOrder: LoadOrder,
  lots: Lot,
  prices: Price[]
) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);

  const reqBody = {
    p_load_order: {
      business_owner_id: businessOwnerId, // viene del user logueado
      load_order_number: Number(loadOrder.load_order_number) || null,
      provider_id: Number(loadOrder.provider_id) || null,
      delivery_date: loadOrder.delivery_date,
      receptor_other: loadOrder.receptor_other ?? null,
      receptor_id: Number(loadOrder.receptor_id) || null,
      transporter_data: loadOrder.transporter_data ?? null,
      delivery_price: Number(loadOrder.delivery_price) || null,
      invoice_number: Number(loadOrder.invoice_number) || null,
      status: loadOrder.status ?? "pending",
    },
    p_lots: lots,
    p_prices: prices,
  };

  const { data, error } = await supabase.rpc(
    "create_load_order_with_lots_and_prices",
    reqBody
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};


export const getLoadOrder = async (loadOrderId: string, userRole: string): Promise<{ dbLoadOrder: LoadOrder | null, error: string | null }> => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: dbLoadOrder, error } = await supabase
    .from("load_orders")
    .select(
      `
      *,
      providers(provider_name),
      lots(
  *,
  prices(*),
  products(*),
  stock(
    *,
    stock_rooms(stock_room_name),
    stores(store_name)
  )
)

    `
    )
    .eq("business_owner_id", businessOwnerId)
    .eq("load_order_id", loadOrderId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const adaptedLoadOrder: LoadOrder | null = dbLoadOrder ? {
    ...dbLoadOrder,
    lots: dbLoadOrder.lots?.map((lot: any) => ({
      ...lot,
      product_name: lot.products?.product_name || 'N/A',
      prices: lot.prices || [],
      stock: lot.stock || [],
    })) || [],
  } : null;

  return { dbLoadOrder: adaptedLoadOrder, error: null };
};