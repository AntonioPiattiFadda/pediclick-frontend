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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { createProductPresentation, getProductPresentations } from "@/service/productPresentations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { Label } from "recharts";
import ProductSelector from "./productSelector";
import type { Product } from "@/types/products";
import toast from "react-hot-toast";

export type ProductPresentation = {
    product_presentation_id: number;
    product_presentation_name: string;
    product_id: number;
    short_code: number;
    created_at: string;
};

// ---------- Context ----------
interface ProductPresentationSelectorContextType {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled: boolean;
    presentations: ProductPresentation[];
    isLoading: boolean;
}

const ProductPresentationSelectorContext =
    createContext<ProductPresentationSelectorContextType | null>(null);

function useProductPresentationSelectorContext() {
    const ctx = useContext(ProductPresentationSelectorContext);
    if (!ctx)
        throw new Error(
            "ProductPresentationSelector components must be used inside Root"
        );
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    productId: number | null;
    value: number | null;
    onChange: (id: number | null) => void;
    disabled?: boolean;
    children: ReactNode;
}

const ProductPresentationSelectorRoot = ({
    productId,
    value,
    onChange,
    disabled = false,
    children,
}: RootProps) => {
    const { data: presentations, isLoading } = useQuery({
        queryKey: ["product_presentations", productId],
        queryFn: async () => {
            const response = await getProductPresentations(productId);
            return response.presentations;
        },
        enabled: !!productId,
    });

    return (
        <ProductPresentationSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                presentations: presentations ?? [],
                isLoading,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </ProductPresentationSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectProductPresentation = () => {
    const { value, onChange, disabled, presentations, isLoading } =
        useProductPresentationSelectorContext();

    const [shortCode, setShortCode] = useState<number | null>(null);

    const handleShortCodeMatch = (shortCode: number | null) => {
        if (shortCode === null) return;
        const matched = presentations.find((p) => p.short_code === shortCode);
        if (matched) {
            onChange(matched.product_presentation_id);
        } else {
            onChange(null);
            toast("No se encontró una presentación con ese código corto", {
                icon: "⚠️",
            });
        }
    };

    if (isLoading) {
        return (
            <Input
                className="h-10"
                placeholder="Buscando presentaciones..."
                disabled
            />
        );
    }

    return (
        <>
            <Input
                className={`border border-gray-200 h-9 w-22 `}
                value={shortCode === null ? "" : String(shortCode)}
                placeholder="Cód.."
                onChange={(e) => {
                    const value = e.target.value;
                    handleShortCodeMatch(Number(value) || null);
                    setShortCode(Number(value) || null);
                }}
            />

            <Select
                disabled={disabled}
                value={value === null ? "" : String(value)}
                onValueChange={(val) => {
                    onChange(val === "" ? null : Number(val));
                    setShortCode(null);
                }}
            >
                <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Seleccionar presentación" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Presentaciones</SelectLabel>
                        {presentations?.map((p) => (
                            <SelectItem
                                key={p.product_presentation_id}
                                value={String(p.product_presentation_id)}
                            >
                                {p.product_presentation_name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(null)}
                    className="text-red-500 hover:text-red-700 h-9"
                >
                    <X className="w-5 h-5" />
                </Button>
            )}
        </>
    );
};

// ---------- Create ----------
const CreateProductPresentation = ({
    isShortCut = false,
}: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useProductPresentationSelectorContext();
    const queryClient = useQueryClient();

    const [newPresentation, setNewPresentation] = useState("");
    const [product, setProduct] = useState<Product>({} as Product);
    const [newShortCode, setNewShortCode] = useState("");
    const [open, setOpen] = useState(false);

    const createMutation = useMutation({
        mutationFn: async (data: {
            name: string;
            shortCode: string;
            productId: number;
        }) => {
            return await createProductPresentation(data.name, data.shortCode, data.productId);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["product_presentations", product?.product_id],
            });
            onChange(data.product_presentation_id);
            setOpen(false);
            setNewPresentation("");
            setNewShortCode("");
            if (isShortCut) {
                toast("Presentación creada", { icon: "✅" });
            }
        },
        onError: (error: any) => {
            toast(error.message, {
                icon: "⚠️",
            });
        },
    });

    const handleCreate = async () => {
        if (!newPresentation || !product?.product_id) return;
        try {
            await createMutation.mutateAsync({
                name: newPresentation,
                shortCode: newShortCode,
                productId: product.product_id,
            });
        } catch (err) {
            console.error("Error creating presentation:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Presentación</SidebarMenuButton>
                ) : (
                    <Button
                        className="border border-gray-200 h-9"
                        disabled={disabled}
                        variant="outline"
                    >
                        + Nuevo
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nueva presentación</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre de la presentación del producto.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={newPresentation}
                    disabled={createMutation.isLoading}
                    onChange={(e) => setNewPresentation(e.target.value)}
                    placeholder="Nombre de la presentación"
                />

                <Label className="mt-2 mb-1">Código corto</Label>
                <Input
                    value={newShortCode}
                    type="number"
                    disabled={createMutation.isLoading}
                    onChange={(e) => setNewShortCode(e.target.value)}
                    placeholder="Código corto"
                />

                <Label className="mt-2 mb-1">Producto</Label>
                <ProductSelector value={product} onChange={setProduct} />

                <DialogFooter>
                    <Button
                        disabled={createMutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createMutation.isLoading || !newPresentation || !product?.product_id}
                        onClick={handleCreate}
                    >
                        {createMutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Compound export ----------
export {
    CreateProductPresentation,
    ProductPresentationSelectorRoot,
    SelectProductPresentation,
};
