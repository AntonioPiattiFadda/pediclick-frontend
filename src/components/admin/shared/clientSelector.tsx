/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient, getClients } from "@/service/clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Client } from "@/types/clients";

// ---------- Context ----------
interface ClientSelectorContextType {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled: boolean;
    clients: Client[];
    isLoading: boolean;
}

const ClientSelectorContext =
    createContext<ClientSelectorContextType | null>(null);

function useClientSelectorContext() {
    const ctx = useContext(ClientSelectorContext);
    if (!ctx)
        throw new Error("ClientSelector components must be used inside Root");
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled?: boolean;
    children: ReactNode;
}

const ClientSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
    const { data: clients, isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients();
            return response.clients;
        },
    });

    return (
        <ClientSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                clients: clients ?? [],
                isLoading,
            }}
        >
            <div className="flex items-center gap-2 w-full">{children}</div>
        </ClientSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectClient = () => {
    const { value, onChange, disabled, clients, isLoading } =
        useClientSelectorContext();

    if (isLoading) {
        return <Input placeholder="Buscando tus clientes..." disabled />;
    }

    return (
        <>
            <select
                className="w-full border rounded px-2 py-2"
                disabled={disabled}
                value={value === null ? "" : value}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
                }
            >
                <option disabled value="">Sin Cliente</option>
                {(clients ?? []).map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                        {client.full_name}
                    </option>
                ))}
            </select>

            {value && (
                <Button
                    variant="ghost"
                    disabled={disabled}
                    size="icon"
                    onClick={() => onChange(null)}
                    className="text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            )}
        </>
    );
};

// ---------- Create ----------
const CreateClient = () => {
    const { onChange, disabled } = useClientSelectorContext();
    const queryClient = useQueryClient();

    const [newClient, setNewClient] = useState("");
    const [open, setOpen] = useState(false);

    const createClientMutation = useMutation({
        mutationFn: async (data: { newClient: string }) => {
            return await createClient(data.newClient);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onChange(data.client_id);
            setOpen(false);
            setNewClient("");
        },
        onError: (error: any) => {
            toast("Error al crear cliente", {
                description: error.message,
            });
        },
    });

    const handleCreateClient = async () => {
        if (!newClient) return;
        try {
            await createClientMutation.mutateAsync({ newClient });
        } catch (err) {
            console.error("Error creating client:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled} variant="outline">
                    + Nuevo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo cliente</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre del nuevo cliente que quieras crear.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={newClient}
                    disabled={createClientMutation.isLoading}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="Nombre del cliente"
                />

                <DialogFooter>
                    <Button
                        disabled={createClientMutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createClientMutation.isLoading}
                        onClick={handleCreateClient}
                    >
                        {createClientMutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Compound export ----------
export {
    ClientSelectorRoot,
    SelectClient,
    CreateClient,
};
