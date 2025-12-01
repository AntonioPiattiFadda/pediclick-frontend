import { supabase } from ".";
import type { ClientTransactionMovements } from "@/types/ClientTransactionMovementssMovements";

export async function getClientTransactionMovements(clientId: string | number): Promise<ClientTransactionMovements[]> {

    if (clientId === undefined || clientId === null || clientId === 0 || clientId === "0") {
        return [];
    }
    const { data, error } = await supabase
        .from("client_transactions")
        .select("*")
        .eq("client_id", clientId);

    if (error) {
        throw new Error(error.message);
    }

    // Ensure number types are correct if backend sends strings
    return data as ClientTransactionMovements[];
}