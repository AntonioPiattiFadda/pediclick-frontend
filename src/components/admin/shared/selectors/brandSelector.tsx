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
import { createBrand, getBrands, updateBrand } from "@/service/brands";
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

// ---------- Context ----------
interface BrandSelectorContextType {
    value: string;
    onChange: (id: string) => void;
    disabled: boolean;
    brands: any[];
    isLoading: boolean;
}

const BrandSelectorContext = createContext<BrandSelectorContextType | null>(
    null
);

function useBrandSelectorContext() {
    const ctx = useContext(BrandSelectorContext);
    if (!ctx) throw new Error("BrandSelector components must be used inside Root");
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
    children: ReactNode;
}

const BrandSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
    const { data: brands, isLoading } = useQuery({
        queryKey: ["brands"],
        queryFn: async () => {
            const response = await getBrands();
            return response.brands;
        },
    });

    return (
        <BrandSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                brands: brands ?? [],
                isLoading,
            }}
        >
            <div className="flex items-center gap-2 w-full">{children}</div>
        </BrandSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectBrand = () => {
    const { value, onChange, disabled, brands, isLoading } =
        useBrandSelectorContext();

    if (isLoading) {
        return <Input placeholder="Buscando tus marcas..." disabled />;
    }

    return (
        <>
            <select
                className={`${disabled && "opacity-50 cursor-not-allowed"} w-full border border-gray-200 rounded px-2 py-2 text-gray-500`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">Sin Marca</option>
                {(brands ?? []).map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                        {brand.brand_name}
                    </option>
                ))}
            </select>
        </>
    );
};

const CancelBrandSelection = () => {
    const { value, onChange } = useBrandSelectorContext();
    console.log("CancelBrandSelection - current value:", value);
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
                <X className="w-5 h-5" />asd
            </Button>
        )
    );
};

// ---------- Create ----------
const CreateBrand = ({ isShortCut = false }: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useBrandSelectorContext();
    const queryClient = useQueryClient();

    const [newBrand, setNewBrand] = useState("");
    const [open, setOpen] = useState(false);

    const createBrandMutation = useMutation({
        mutationFn: async (data: { newBrand: string }) => {
            return await createBrand(data.newBrand);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            onChange(data.brand_id);
            setOpen(false);
            setNewBrand("");
            if (isShortCut) {
                toast.success("Marca creada");
            }
        },
        onError: (error: any) => {
            toast("Error al crear marca", {
                description: error.message,
            });
        },
    });

    const handleCreateBrand = async () => {
        if (!newBrand) return;
        try {
            await createBrandMutation.mutateAsync({ newBrand });
        } catch (err) {
            console.error("Error creating brand:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ?
                    <SidebarMenuButton>Marca</SidebarMenuButton> : <Button
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        + Nuevo
                    </Button>}

            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nueva marca</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre de la nueva marca que quieras crear.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={newBrand}
                    disabled={createBrandMutation.isLoading}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Nombre de la marca"
                />

                <DialogFooter>
                    <Button
                        disabled={createBrandMutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createBrandMutation.isLoading}
                        onClick={handleCreateBrand}
                    >
                        {createBrandMutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Update ----------


const UpdateBrandSelection = () => {
    const {
        value: selectedBrandId,
        onChange,
        disabled,
        brands,
    } = useBrandSelectorContext();

    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [brandName, setBrandName] = useState("");

    //  Traigo la brand actual del selector

    const currentBrand = brands?.find(
        (b) => b.brand_id === Number(selectedBrandId)
    );

    console.log("Brands List:", brands);
    console.log("Selected Brand ID:", selectedBrandId);
    console.log("Current Brand:", currentBrand);


    //  Cada vez que cambia la brand seleccionada → precargo nombre

    useEffect(() => {
        if (currentBrand) setBrandName(currentBrand.brand_name);
    }, [currentBrand]);


    //  Mutación para update

    const updateBrandMutation = useMutation({
        mutationFn: (data: { id: number; brand_name: string }) =>
            updateBrand(data.id, { brand_name: data.brand_name }),

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });

            onChange(data.brand_id); // actualizar selector

            toast.success("Marca actualizada correctamente");

            setOpen(false);
        },

        onError: (error: any) => {
            toast.error("Error al actualizar marca", {
                description: error.message,
            });
        },
    });

    const handleUpdate = async () => {
        if (!brandName || !selectedBrandId) return;

        await updateBrandMutation.mutateAsync({
            id: Number(selectedBrandId),
            brand_name: brandName,
        });
    };

    // Si no hay brand seleccionada → no mostrar botón
    if (!selectedBrandId) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="border border-gray-200"
                    disabled={disabled}
                    variant="outline"
                >
                    Editar
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar marca</DialogTitle>
                    <DialogDescription>
                        Modificá la marca seleccionada.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={brandName}
                    disabled={updateBrandMutation.isLoading}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Nombre de la marca"
                />

                <DialogFooter>
                    <Button
                        variant="outline"
                        disabled={updateBrandMutation.isLoading}
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>

                    <Button
                        disabled={updateBrandMutation.isLoading}
                        onClick={handleUpdate}
                    >
                        {updateBrandMutation.isLoading ? "Editando..." : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// ---------- Compound export ----------
export {
    BrandSelectorRoot,
    SelectBrand,
    CreateBrand,
    CancelBrandSelection,
    UpdateBrandSelection
};
