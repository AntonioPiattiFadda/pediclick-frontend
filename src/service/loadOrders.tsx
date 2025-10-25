// import type { LoadOrder } from "@/types";
import type { LoadOrder } from "@/types/loadOrders";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";
import type { Stock } from "@/types/stocks";

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

export const getAllLoadOrders = async () => {
  const businessOwnerId = await getBusinessOwnerId();
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
  loadOrder: LoadOrder,
  lots: Lot[],
  prices: Price[]
) => {

  console.log("Creating load order with data:", { loadOrder, lots, prices });
  const businessOwnerId = await getBusinessOwnerId();

  const reqBody = {
    p_load_order: {
      business_owner_id: businessOwnerId, // viene del user logueado
      load_order_number: Number(loadOrder.load_order_number) || null,
      provider_id: Number(loadOrder.provider_id) || null,
      delivery_date: loadOrder.delivery_date,
      receptor_other: loadOrder.receptor_other ?? null,
      receptor_id: Number(loadOrder.receptor_id) || null,
      transporter_data: loadOrder.transporter_data ?? null,
      invoice_number: Number(loadOrder.invoice_number) || null,
      status: loadOrder.status ?? "pending",
    },
    p_lots: lots,
    // p_prices: prices,
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


export const getLoadOrder = async (loadOrderId: string,): Promise<{ dbLoadOrder: LoadOrder | null, error: string | null }> => {
  const businessOwnerId = await getBusinessOwnerId();
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

  console.log("Raw LoadOrder data:", dbLoadOrder, error);

  if (error) {
    throw new Error(error.message);
  }

  type DbLot = Lot & {
    products?: { product_name?: string | null } | null;
    prices?: Price[] | null;
    stock?: Stock[] | null;
  };

  const adaptedLoadOrder: LoadOrder | null = dbLoadOrder
    ? {
      ...dbLoadOrder,
      lots:
        ((dbLoadOrder as { lots?: DbLot[] }).lots ?? []).map((lot) => ({
          ...lot,
          product_name: lot.products?.product_name || "N/A",
          prices: lot.prices ?? [],
          stock: lot.stock ?? [],
        })),
    }
    : null;



  return { dbLoadOrder: adaptedLoadOrder, error: null };
};

export const getFollowingLoadOrderNumber = async (): Promise<number> => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data, error } = await supabase
    .from("load_orders")
    .select("load_order_number")
    .eq("business_owner_id", businessOwnerId)
    .order("load_order_number", { ascending: false }) // ordenar de mayor a menor
    .limit(1)

  console.log("maxLoadOrder", data);
  console.log("error", error);

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, lo tratamos como "no hay lotes"
    throw new Error(error.message);
  }

  const lastLoadOrderNumber = data?.[0]?.load_order_number ?? 0;
  return lastLoadOrderNumber + 1;
};

