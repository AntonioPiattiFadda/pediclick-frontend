import { supabase } from ".";
import { getOrganizationId } from "./profiles";
import type { Client } from "@/types/clients";

export const getClients = async () => {
    const organizationId = await getOrganizationId();
    const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organizationId);

    if (error) {
        throw new Error(error.message);
    }

    return { clients, error };
};

export const createClient = async (clientData: Partial<Client>) => {
    const organizationId = await getOrganizationId();
    const { data, error } = await supabase
        .from("clients")
        .insert({ ...clientData, organization_id: organizationId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteClient = async (id: string | number) => {
    const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("client_id", id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
};

export const updateClient = async (
    id: string | number,
    updates: Partial<Client>
) => {
    const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("client_id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Client;
};


export const getClient = async (clientId: number): Promise<{ client: Client | null, error: Error | null }> => {
    const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", clientId)
        .single()

    if (error) {
        throw new Error(error.message);
    }

    return { client, error };
};