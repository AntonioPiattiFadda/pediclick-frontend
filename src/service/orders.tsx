import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getDailySalesLast30Days = async () => {
  const organizationId = await getOrganizationId();

  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_amount")
    .eq("organization_id", organizationId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

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