import type { OrderItem } from "@/types/orderItems";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getLotSales = async (lotId: number): Promise<Partial<OrderItem>[]> => {
  console.log("lotId", lotId);

  const { data, error } = await supabase
    .from("order_items")
    .select("quantity, price, total, created_at, subtotal, discount, tax, logic_type, price_type, status, location_id")
    .eq("lot_id", lotId)
    .eq("status", "COMPLETED")
  // .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  //       quantity: 4,
  //         price: 6000,
  //           total: 24000,
  //             created_at: '2025-12-03T19:32:29.986939',
  //               subtotal: 24000,
  //                 discount: 0,
  //                   tax: 0,
  //                       logic_type: 'QUANTITY_DISCOUNT',
  //                         price_type: 'MINOR',
  //                               status: 'COMPLETED',
  //                                 location_id: 2,

  console.log(data, error);

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