import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getStockRooms = async () => {
    const businessOwnerId = await getBusinessOwnerIdByRole();

    const { data: stockRooms, error } = await supabase
        .from("stock_rooms")
        .select("*")
        .eq("business_owner_id", businessOwnerId)
        .is("deleted_at", null);


    if (error) {
        throw new Error(error.message);
    }

    return { stockRooms, error };
};

export const createStockRoom = async (stockRoomName: string) => {
    const businessOwnerId = await getBusinessOwnerIdByRole();

    const { data, error } = await supabase
        .from("stock_rooms")
        .insert({ stock_room_name: stockRoomName, business_owner_id: businessOwnerId })
        .select("*");

    if (error) {
        throw new Error(error.message);
    }

    return { stockRoom: data[0], error };
};
