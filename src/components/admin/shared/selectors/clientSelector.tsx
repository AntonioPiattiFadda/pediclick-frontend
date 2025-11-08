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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient, getClients } from "@/service/clients";
import type { Client } from "@/types/clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";

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
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </ClientSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectClient = () => {
    const { value, onChange, disabled, clients, isLoading } =
        useClientSelectorContext();

    if (isLoading) {
        return <Input className="h-10" placeholder="Buscando tus clientes..." disabled />;
    }

    return (
        <>
            <select
                className="w-full border rounded px-2 py-2 h-10"
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
                    className="text-red-500 hover:text-red-700 h-10"
                >
                    <Trash2 className="w-5 h-10" />
                </Button>
            )}
        </>
    );
};

import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { taxConditionsOpt } from "@/constants";


const CreateClient = ({ isShortCut = false }: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useClientSelectorContext();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        tax_ident: "",
        tax_condition: "FINAL_CONSUMER",
        billing_enabled: true,
        credit_limit: 0,
        current_balance: 0,
        available_credit: 0,
        is_active: true,
    });

    // 🔁 Mutación para crear cliente
    const createClientMutation = useMutation({
        mutationFn: async (data: Partial<Client>) => {
            toast.loading("Creando cliente...");

            const adaptedClient = {
                ...data,
                available_credit: data.credit_limit || 0,
            }
            return await createClient(adaptedClient);
        },
        onSuccess: (data: Client) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onChange(data.client_id || null);
            toast.success("Cliente creado correctamente");
            setOpen(false);
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                address: "",
                tax_ident: "",
                tax_condition: "FINAL_CONSUMER",
                billing_enabled: true,
                credit_limit: 0,
                current_balance: 0,
                available_credit: 0,
                is_active: true,
            });
            if (isShortCut) {
                toast.success("Cliente creado");
            }
        },
        onError: (error: any) => {
            toast.error("Error al crear cliente", {
                description: error.message,
            });
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: keyof Client) => {
        setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const handleCreateClient = async () => {
        if (!formData.full_name?.trim()) {
            toast.error("El nombre del cliente es obligatorio");
            return;
        }

        try {
            await createClientMutation.mutateAsync(formData);
        } catch (err) {
            console.error("Error creating client:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ?
                    <SidebarMenuButton>Cliente</SidebarMenuButton>
                    : <Button
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        + Nuevo
                    </Button>}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo cliente</DialogTitle>
                    <DialogDescription>
                        Completá los datos del cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Nombre / Razón social *</Label>
                        <Input
                            name="full_name"
                            placeholder="Nombre..."
                            value={formData.full_name || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label>Email</Label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="cliente@correo.com"
                            value={formData.email || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label>Teléfono</Label>
                            <Input
                                name="phone"
                                placeholder="351..."
                                value={formData.phone || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>CUIT</Label>
                            <Input
                                name="tax_ident"
                                placeholder="Numero de cuit"
                                value={formData.tax_ident || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label>Dirección</Label>
                        <Input
                            name="address"
                            placeholder="Ingresa dirección"
                            value={formData.address || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label>Cond. IVA</Label>
                            <Select name="tax_condition"
                                value={formData.tax_condition}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        tax_condition: value as any,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar condición" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Condiciones de IVA</SelectLabel>
                                        {taxConditionsOpt.map((condition) => (
                                            <SelectItem key={condition.value} value={condition.value}>
                                                {condition.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>


                            {/* <Input
                                name="tax_condition"
                                placeholder="Responsable inscripto"
                                value={formData.tax_condition || ""}
                                onChange={handleChange}
                            /> */}
                        </div>
                        <div className="grid gap-1">
                            <Label>Límite de crédito</Label>
                            <Input
                                name="credit_limit"
                                type="number"
                                placeholder="--"
                                value={formData.credit_limit || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="billing_enabled">Facturación</Label>
                        <Switch
                            id="billing_enabled"
                            checked={formData.billing_enabled}
                            onCheckedChange={() => handleToggle("billing_enabled")}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        disabled={createClientMutation.isLoading}
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateClient}
                        disabled={createClientMutation.isLoading}
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
    ClientSelectorRoot, CreateClient, SelectClient
};
