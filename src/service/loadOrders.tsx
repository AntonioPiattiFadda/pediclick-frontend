// import type { LoadOrder } from "@/types";
import type { LoadOrder, LoadOrderUnit } from "@/types/loadOrders";
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import { adaptLoadOrderForSubmission } from "@/adapters/loadOrders";

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

export const getAllLoadOrders = async (page: number, pageSize: number) => {
  const businessOwnerId = await getBusinessOwnerId();
  const { data: dbLoadOrders, error } = await supabase
    .from("load_orders")
    .select(
      `*,
      providers(provider_name)
        `
    )
    .order("created_at", { ascending: false })
    .is("deleted_at", null)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .eq("business_owner_id", businessOwnerId);



  if (error) {
    throw new Error(error.message);
  }

  return { dbLoadOrders, error: null };
};


// create or replace function public.create_load_order(
//   p_load_order jsonb,
//   p_units jsonb,
//   p_business_owner_id uuid
// )
export const createLoadOrder = async (
  loadOrder: LoadOrder,
  lots: Lot[],
  stock: Stock[],
  lotContainersStock: LotContainersStock[]
) => {

  const units: LoadOrderUnit[] = adaptLoadOrderForSubmission(lots, stock, lotContainersStock);
  console.log("units", units);

  const businessOwnerId = await getBusinessOwnerId();

  const reqBody: {
    p_load_order: LoadOrder,
    p_units: LoadOrderUnit[],
    p_business_owner_id: number,
  } = {
    p_load_order: {
      business_owner_id: businessOwnerId, // viene del user logueado
      load_order_number: Number(loadOrder.load_order_number) || null,
      provider_id: Number(loadOrder.provider_id) || null,
      delivery_date: loadOrder.delivery_date,
      receptor_other: loadOrder.receptor_other ?? null,
      receptor_id: Number(loadOrder.receptor_id) || null,
      transporter_data: loadOrder.transporter_data ?? null,
      invoice_number: Number(loadOrder.invoice_number) || null,
      status: loadOrder.status ?? "PENDING",
      observations: loadOrder.observations ?? null,
      total_download_cost: loadOrder.total_download_cost,
      lots: [], // ahora se envian en p_units
    },
    p_units: units,
    p_business_owner_id: businessOwnerId,
  };

  const { data, error } = await supabase.rpc(
    "create_load_order",
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
  products(*),
  stock!inner(
    *
  )
)

    `
    )
    .eq("business_owner_id", businessOwnerId)
    .eq("load_order_id", loadOrderId)
    // .gt("lots.stock.quantity", 0)
    .single();


  if (error) {
    throw new Error(error.message);
  }

  type DbLot = Lot & {
    products?: { product_name?: string | null } | null;
    stock?: Stock[] | null;
  };

  const adaptedLoadOrder: LoadOrder | null = dbLoadOrder
    ? {
      ...dbLoadOrder,
      lots:
        ((dbLoadOrder as { lots?: DbLot[] }).lots ?? []).map((lot) => ({
          ...lot,
          product_name: lot.products?.product_name || "N/A",
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


  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, lo tratamos como "no hay lotes"
    throw new Error(error.message);
  }

  const lastLoadOrderNumber = data?.[0]?.load_order_number ?? 0;
  return lastLoadOrderNumber + 1;
};

export const deleteLoadOrder = async (loadOrderId: number): Promise<void> => {
  const businessOwnerId = await getBusinessOwnerId();
  const { error } = await supabase
    .from("load_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("load_order_id", loadOrderId)
    .eq("business_owner_id", businessOwnerId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return;
}