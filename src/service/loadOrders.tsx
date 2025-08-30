// import type { LoadOrder } from "@/types";
import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

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

export const getAllLoadOrdersMock = async (userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
  const { data: dbLoadOrders, error } = await supabase
    .from("load_orders")
    .select("*")
    .eq("business_owner_id", businessOwnerId)
    
console.log(dbLoadOrders)

  if (error) {
    throw new Error(error.message);
  }

  return { dbLoadOrders, error: null };
};
