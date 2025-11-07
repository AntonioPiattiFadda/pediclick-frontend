import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClients } from "@/service/clients";
import type { Client } from "@/types/clients";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import TableSkl from "../sellPoints/ui/tableSkl";
import { ClientsTable } from "./ClientsTable";
import { ClientSelectorRoot, CreateClient } from "../shared/clientSelector";
import { formatCurrency } from "@/utils";
import { getProviders } from "@/service/providers";
import { CreateProvider, ProviderSelectorRoot } from "../shared/providersSelector";
import { ProvidersTable } from "../providers/ProvidersTable";
import type { Provider } from "@/types/providers";

export const ClientsContainer = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");


    const { data: clients = [], isLoading: isLoadingClients, isError: isErrorClients } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients();
            return (response.clients ?? []) as Client[];
        },
    });


    const { data: providers = [], isLoading: isLoadingProviders, isError: isErrorProviders } = useQuery({
        queryKey: ["providers"],
        queryFn: async () => {
            const response = await getProviders();
            return (response.providers ?? []) as Provider[];
        },
    });

    if (isLoadingClients || isLoadingProviders) {
        return <TableSkl />;
    }

    if (isErrorClients || isErrorProviders) {
        return <div>Error loading data.</div>;
    }


    const totalClientsDebts = clients.reduce((total, client) => total + (client.current_balance || 0), 0);
    const totalClientsCreditLimit = clients.reduce((total, client) => total + (client.credit_limit || 0), 0);
    const totalClientsAvailableCredit = clients.reduce((total, client) => total + (client.available_credit || 0), 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Clientes</CardTitle>
                            <CardDescription>Gestiona tus clientes</CardDescription>
                        </div>

                        <div className="ml-14">
                            <h3 className="text-lg font-medium">Deuda total de clientes: </h3>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(totalClientsDebts)}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium">Límite de crédito total: </h3>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(totalClientsCreditLimit)}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium">Crédito disponible total: </h3>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(totalClientsAvailableCredit)}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full ml-auto md:w-auto">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Buscar clientes por nombre, email, documento, teléfono, ciudad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />

                            </div>
                        </div>

                        <div>
                            <ClientSelectorRoot value={null} onChange={() => { }}>
                                <CreateClient />
                            </ClientSelectorRoot>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ClientsTable clients={clients} filter={searchTerm} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Proveedores</CardTitle>
                            <CardDescription>Gestiona tus proveedores</CardDescription>
                        </div>


                        <div className="flex flex-col sm:flex-row gap-2 w-full ml-auto md:w-auto">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Buscar proveedores por nombre, email, documento, teléfono, ciudad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />

                            </div>
                        </div>

                        <div>
                            <ProviderSelectorRoot value={null} onChange={() => { }}>
                                <CreateProvider />
                            </ProviderSelectorRoot>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProvidersTable providers={providers} filter={searchTerm} />
                </CardContent>
            </Card>
        </div>
    );
};