import { getClient } from "@/service/clients";
import { useQuery } from "@tanstack/react-query";
import ClientInformation from "./clientInformation";

const ClientInformationContainer = ({ clientId, showHistoricalMvtsBtn = true }: { clientId: number, showHistoricalMvtsBtn?: boolean }) => {

    const { data: client, isLoading: isLoading, isError } = useQuery({
        queryKey: ["clients", clientId],
        queryFn: async () => {
            const { client } = await getClient(clientId);
            return client;
        },
    });


    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading client information</div>;
    if (!client) return <div>No client found</div>;

    return (
        <ClientInformation showHistoricalMvtsBtn={showHistoricalMvtsBtn} selectedClient={client} />

    )
}

export default ClientInformationContainer