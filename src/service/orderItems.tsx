import type { OrderItem } from "@/types/orderItems";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getLotSales = async (lotId: number, page: number, pageSize: number): Promise<Partial<OrderItem>[]> => {

  const { data, error } = await supabase
    .from("order_items")
    .select("quantity, price, total, created_at, subtotal, discount, tax, logic_type, price_type, status, location_id, product_presentation_id")
    .eq("lot_id", lotId)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("created_at", { ascending: false })
    .eq("status", "COMPLETED")

  if (error) throw new Error(error.message);

  return data;
};

export const getAllLotSales = async (lotId: number): Promise<Partial<OrderItem>[]> => {

  const { data, error } = await supabase
    .from("order_items")
    .select("quantity, price, total, created_at, subtotal, discount, tax, logic_type, price_type, status, location_id, product_presentation_id")
    .eq("lot_id", lotId)
    .order("created_at", { ascending: false })
    .eq("status", "COMPLETED")

  if (error) throw new Error(error.message);

  return data;
};

export const getMostSoldProducts = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data, error } = await supabase.rpc(
    "get_top_products_last_month",
    {
      p_business_owner_id: businessOwnerId,
    }
  );

  console.log(data, error);

  if (error) {
    throw new Error(error.message);
  }
  return data;
}