import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getPurchasingAgents = async () => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data: purchasingAgents, error } = await supabase
        .from("purchasing_agents")
        .select("*")
        .eq("business_owner_id", businessOwnerId);

    if (error) {
        throw new Error(error.message);
    }

    return { purchasingAgents, error };
};

export const createPurchasingAgent = async (name: string) => {
    const businessOwnerId = await getBusinessOwnerId();
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
