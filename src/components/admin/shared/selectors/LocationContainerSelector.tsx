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
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { LotContainer } from "@/types/lotContainers";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const { data: lotContainers, isLoading, isError } = useQuery({
        queryKey: ["lotContainers"],
        queryFn: async () => {
            const response = await getLotContainers();
            return response.lotContainers;
        },
    });

    // 👉 Auto-selección
    useEffect(() => {
        if (!isLoading && lotContainers && lotContainers.length > 0) {
            if (!value) {
                onChange(lotContainers[0]); // selecciona el primero
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, lotContainers]);

    if (isError) {
        return <div>Error al cargar los contenedores de lote</div>;
    }

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
            <div className="flex w-full border border-gray-200 rounded-md ">
                {/* <Input
                    className={`  border-none    h-9 w-14 `}
                    value={shortCode ?? ""}
                    placeholder="Código"
                    disabled={disabled}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChangeShortCode(Number(val));
                        handleCodeMatch(Number(val));
                    }}
                /> */}

                <Select
                    disabled={disabled}
                    value={value?.lot_container_id.toString() ?? ""}
                    onValueChange={(val) => {
                        const m = lotContainers.find((m) => m.lot_container_id === val) || null;
                        onChange(m);
                        // onChangeShortCode(m?.short_code ?? null);
                    }}
                >
                    <SelectTrigger className="h-11 w-full border-none">
                        <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Clientes</SelectLabel>
                            {lotContainers.map((lcs) => {
                                // const label = m.short_code ? `${m.short_code} - ${m.full_name}` : m.full_name;
                                return (
                                    <SelectItem
                                        key={lcs.lot_container_id}
                                        value={lcs.lot_container_id}>
                                        {lcs.lot_container_name}
                                    </SelectItem>
                                )
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

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
