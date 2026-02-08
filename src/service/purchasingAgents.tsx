import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getPurchasingAgents = async () => {
    const organizationId = await getOrganizationId();
    const { data: purchasingAgents, error } = await supabase
        .from("purchasing_agents")
        .select("*")
        .eq("organization_id", organizationId);

    if (error) {
        throw new Error(error.message);
    }

    return { purchasingAgents, error };
};

export const createPurchasingAgent = async (name: string) => {
    const organizationId = await getOrganizationId();
    const { data, error } = await supabase
        .from("purchasing_agents")
        .insert({ purchasing_agent_name: name, organization_id: organizationId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
