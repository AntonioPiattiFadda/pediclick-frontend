import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getDailySalesLast30Days = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_amount")
    .eq("business_owner_id", businessOwnerId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());



  console.log(data, error);

  if (error) throw new Error(error.message);

  const aggregated: Record<string, number> = {};

  data.forEach((order) => {
    const day = order.created_at.split("T")[0];
    aggregated[day] = (aggregated[day] || 0) + Number(order.total_amount);
  });

  const result = Object.entries(aggregated).map(([day, total]) => ({
    date: day,
    sales: total
  }));

  return result;
};