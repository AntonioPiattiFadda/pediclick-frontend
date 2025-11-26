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
import { createLotContainer, getLotContainers } from "@/service/lotContainer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { LotContainer } from "@/types/lotContainers";

// ---------- Context ----------
interface LotContainerSelectorContextType {
    value: LotContainer | null;
    onChange: (value: LotContainer | null) => void;
    disabled: boolean;
    lotContainers: any[];
    isLoading: boolean;
}

const LotContainerSelectorContext = createContext<LotContainerSelectorContextType | null>(null);

function useLotContainerSelectorContext() {
    const ctx = useContext(LotContainerSelectorContext);
    if (!ctx) throw new Error("LotContainerSelector components must be used inside Root");
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: LotContainer | null;
    onChange: (value: LotContainer | null) => void;
    disabled?: boolean;
    children: ReactNode;
}

const LotContainerSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
    const { data: lotContainers, isLoading } = useQuery({
        queryKey: ["lotContainers"],
        queryFn: async () => {
            const response = await getLotContainers();
            return response.lotContainers;
        },
    });

    return (
        <LotContainerSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                lotContainers: lotContainers ?? [],
                isLoading,
            }}
        >
            <div className="flex items-center gap-2 w-full">{children}</div>
        </LotContainerSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectLotContainer = () => {
    const { value, onChange, disabled, lotContainers, isLoading } =
        useLotContainerSelectorContext();

    if (isLoading) {
        return <Input placeholder="Buscando contenedores de lote..." disabled />;
    }

    return (
        <>
            <select
                className={`${disabled && "opacity-50 cursor-not-allowed"} w-full border border-gray-200 rounded px-2 py-2 text-gray-500`}
                value={value === null ? "" : String(value.lot_container_id)}
                onChange={(e) => onChange(
                    e.target.value ? lotContainers.find(container => container.lot_container_id === Number(e.target.value)) || null : null
                )}
                disabled={disabled}
            >
                <option disabled value="">Sin contenedor</option>
                {(lotContainers ?? []).map((container) => (
                    <option key={container.lot_container_id} value={container.lot_container_id}>
                        {container.lot_container_name}
                    </option>
                ))}
            </select>

            {/* {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(null)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700"
                >
                    <X className="w-5 h-5" />
                </Button>
            )} */}
        </>
    );
};

// ---------- Create ----------
const CreateLotContainer = ({ isShortCut = false }: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useLotContainerSelectorContext();
    const queryClient = useQueryClient();

    const [newContainer, setNewContainer] = useState("");
    const [newContainerPrice, setNewContainerPrice] = useState<number | null>(null);
    const [open, setOpen] = useState(false);

    const createLotContainerMutation = useMutation({
        mutationFn: async (data: { newContainer: string, newContainerPrice: number | null }) => {
            return await createLotContainer(data.newContainer, data.newContainerPrice);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["lotContainers"] });
            onChange(data.lot_container_id);
            setOpen(false);
            setNewContainer("");
            if (isShortCut) {
                toast.success("Contenedor de lote creado");
            }
        },
        onError: (error: any) => {
            toast("Error al crear contenedor de lote", {
                description: error.message,
            });
        },
    });

    const handleCreateLotContainer = async () => {
        if (!newContainer) return;
        try {
            await createLotContainerMutation.mutateAsync({ newContainer, newContainerPrice });
        } catch (err) {
            console.error("Error creating lot container:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Contenedor de lote</SidebarMenuButton>
                ) : (
                    <Button
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        + Nuevo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo contenedor de lote</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre del nuevo contenedor de lote que quieras crear.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={newContainer}
                    disabled={createLotContainerMutation.isLoading}
                    onChange={(e) => setNewContainer(e.target.value)}
                    placeholder="Nombre del contenedor de lote"
                />
                <Input
                    type="number"
                    value={newContainerPrice ?? ""}
                    disabled={createLotContainerMutation.isLoading}
                    onChange={(e) => setNewContainerPrice(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Precio del contenedor de lote"
                />

                <DialogFooter>
                    <Button
                        disabled={createLotContainerMutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createLotContainerMutation.isLoading}
                        onClick={handleCreateLotContainer}
                    >
                        {createLotContainerMutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// -------- Cancel ----------
const CancelLotContainerSelection = () => {
    const { value, onChange } = useLotContainerSelectorContext();

    return (
        value && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    onChange(null);
                }}
                className="text-red-500 hover:text-red-700 h-9"
            >
                <X className="w-5 h-5" />
            </Button>
        )
    );
};

// ---------- Compound export ----------
export {
    LotContainerSelectorRoot,
    SelectLotContainer,
    CreateLotContainer,
    CancelLotContainerSelection,
};
