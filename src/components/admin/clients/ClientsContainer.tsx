import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClients } from "@/service/clients";
import type { Client } from "@/types/clients";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import TableSkl from "../sellPoints/ui/tableSkl";
import { ClientsTable } from "./ClientsTable";

export const ClientsContainer = () => {

    const [searchTerm, setSearchTerm] = useState<string>("");


    const { data: clients = [], isLoading, isError } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients();
            return (response.clients ?? []) as Client[];
        },
    });

    if (isLoading) {
        return <TableSkl />;
    }

    if (isError) {
        return <TableSkl />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Clientes</CardTitle>
                            <CardDescription>Gestiona tus clientes</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ClientsTable clients={clients} filter={searchTerm} />
                </CardContent>
            </Card>
        </div>
    );
};