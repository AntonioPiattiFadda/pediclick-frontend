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
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { Label } from "recharts";
import ProductSelector from "./productSelector";
import type { Product } from "@/types/products";
import toast from "react-hot-toast";
import { debounce } from "lodash";
import type { ProductPresentation } from "@/types/product_presentation";

// ---------- Context ----------
interface ProductPresentationSelectorContextType {
    value: ProductPresentation | null;
    onChange: (id: ProductPresentation | null) => void;
    disabled: boolean;
    presentations: ProductPresentation[];
    isLoading: boolean;
    productId: number | null;
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
    value: ProductPresentation | null;
    onChange: (id: ProductPresentation | null) => void;
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
    console.log("ProductPresentationSelectorRoot render", productId, value);

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
                productId


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
            debouncedToast.cancel();
            onChange(matched);
        } else {
            onChange(null);
            debouncedToast(`No se encontró una presentación con ese código: ${shortCode}`);
        }
    };

    const debouncedToast = useMemo(
        () =>
            debounce((msg: string) => {
                toast(`${msg}`, {
                    icon: "⚠️",
                });
            }, 500),
        []
    );

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
                value={value === null ? "" : String(value.product_presentation_id)}
                onValueChange={(val) => {
                    onChange(val === "" ? null : presentations.find((p) => p.product_presentation_id === Number(val)) || null);
                    setShortCode(presentations.find((p) => p.product_presentation_id === Number(val))?.short_code || null);
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
                                {`${p.short_code ?? ''} ${p.short_code ? '-' : ''} ${p.product_presentation_name}`}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            <Input
                className={`border border-gray-200 h-9 w-22 `}
                value={presentations.find((p) => p.product_presentation_id === value?.product_presentation_id)?.bulk_quantity_equivalence ?? ''}
                placeholder="Unidad/Kg por presentación"
                disabled

            />

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
    const { onChange, disabled, productId } = useProductPresentationSelectorContext();
    const queryClient = useQueryClient();

    const [newPresentation, setNewPresentation] = useState("");
    const [product, setProduct] = useState<Product>({} as Product);
    const [newShortCode, setNewShortCode] = useState<number | null>(null);
    const [newBulkQuantityEquivalence, setNewBulkQuantityEquivalence] = useState<number | null>(null);
    const [open, setOpen] = useState(false);

    const createMutation = useMutation({
        mutationFn: async (data: {
            name: string;
            shortCode: number | null;
            productId: number;
            bulkQuantityEquivalence: number | null;
        }) => {
            return await createProductPresentation(data.name, data.shortCode, data.productId, data.bulkQuantityEquivalence);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["product_presentations", productId ? productId : product?.product_id],
            });
            onChange(data.product_presentation_id);
            setOpen(false);
            setNewPresentation("");
            setNewShortCode(null);
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
        if (!newPresentation || (productId === null && !product?.product_id)) return;
        try {
            await createMutation.mutateAsync({
                name: newPresentation,
                shortCode: newShortCode,
                productId: productId ? productId : product.product_id || 0,
                bulkQuantityEquivalence: newBulkQuantityEquivalence,
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

                {productId === null && (
                    <>
                        <Label className="mt-2 mb-1">Producto</Label>
                        <ProductSelector value={product} onChange={setProduct} />
                    </>
                )}

                <Input
                    value={newPresentation}
                    disabled={createMutation.isLoading}
                    onChange={(e) => setNewPresentation(e.target.value)}
                    placeholder="Nombre de la presentación"
                />

                <Label className="mt-2 mb-1">Código corto</Label>
                <Input
                    value={newShortCode === null ? "" : String(newShortCode)}
                    type="number"
                    disabled={createMutation.isLoading}
                    onChange={(e) => setNewShortCode(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Código corto"
                />

                <Label className="mt-2 mb-1">Código corto</Label>
                <Input
                    value={newBulkQuantityEquivalence === null ? "" : String(newBulkQuantityEquivalence)}
                    type="number"
                    disabled={createMutation.isLoading}
                    onChange={(e) => setNewBulkQuantityEquivalence(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Unidad/Kg por presentacion"
                />




                <DialogFooter>
                    <Button
                        disabled={createMutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createMutation.isLoading || !newPresentation || (productId === null && !product?.product_id)}
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
