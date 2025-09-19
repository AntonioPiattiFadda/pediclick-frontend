import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getPurchasingAgents = async (userRole: string) => {
    const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
    const { data: purchasingAgents, error } = await supabase
        .from("purchasing_agents")
        .select("*")
        .eq("business_owner_id", businessOwnerId);

    if (error) {
        throw new Error(error.message);
    }

    return { purchasingAgents, error };
};

export const createPurchasingAgent = async (name: string, userRole: string) => {
    const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
    const { data, error } = await supabase
        .from("purchasing_agents")
        .insert({ purchasing_agent_name: name, business_owner_id: businessOwnerId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
