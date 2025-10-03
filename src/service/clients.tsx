import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { Client } from "@/types/clients";

export const getClients = async () => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("business_owner_id", businessOwnerId);

    if (error) {
        throw new Error(error.message);
    }

    return { clients, error };
};

export const createClient = async (name: string) => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data, error } = await supabase
        .from("clients")
        .insert({ full_name: name, business_owner_id: businessOwnerId })
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
        .delete()
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
