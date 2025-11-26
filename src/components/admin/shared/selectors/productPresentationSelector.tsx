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
import { PlusCircle, X } from "lucide-react";
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
import type { ProductPresentation } from "@/types/productPresentation";

// ---------- Context ----------
interface ProductPresentationSelectorContextType {
    value: ProductPresentation | null;
    onChange: (id: ProductPresentation | null) => void;
    disabled: boolean;
    presentations: ProductPresentation[];
    isLoading: boolean;
    productId: number | null;
    shortCode: number | null;
    onChangeCode: (code: number | null) => void;
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
    isFetchWithLots?: boolean;
    isFetchedWithLotContainersLocation?: boolean;

}

const ProductPresentationSelectorRoot = ({
    productId,
    value,
    onChange,
    disabled = false,
    children,
    isFetchWithLots = false,
    isFetchedWithLotContainersLocation = false,
}: RootProps) => {

    const { data: presentations, isLoading, isError } = useQuery({
        queryKey: ["product_presentations", productId],
        queryFn: async () => {
            const response = await getProductPresentations(productId, isFetchWithLots, isFetchedWithLotContainersLocation);
            return response.presentations;
        },
        enabled: !!productId,
    });

    const [shortCode, setShortCode] = useState<number | null>(value?.short_code || null);

    if (isError) {
        return <div>Error loading product presentations.</div>;
    }

    return (
        <ProductPresentationSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                presentations: presentations ?? [],
                isLoading,
                productId,
                shortCode,
                onChangeCode: setShortCode,



            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </ProductPresentationSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectProductPresentation = ({ children }: {
    children?: ReactNode;
}) => {
    const { value, onChange, disabled, presentations, isLoading, shortCode, onChangeCode } =
        useProductPresentationSelectorContext();


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
            <div className="flex w-full border border-gray-200 rounded-md ">

                <Input
                    className={`  border-none    h-9 w-14 `}
                    disabled={disabled}
                    value={shortCode === null ? "" : String(shortCode)}
                    placeholder="Cód.."
                    onChange={(e) => {
                        const value = e.target.value;
                        handleShortCodeMatch(Number(value) || null);
                        onChangeCode(Number(value) || null);
                    }}
                />
                <div className="h-full w-1 bg-gray-100"></div>

                <Select
                    disabled={disabled}
                    value={value === null ? "" : String(value.product_presentation_id)}
                    onValueChange={(val) => {
                        onChange(val === "" ? null : presentations.find((p) => p.product_presentation_id === Number(val)) || null);
                        onChangeCode(presentations.find((p) => p.product_presentation_id === Number(val))?.short_code || null);
                    }}
                >
                    <SelectTrigger className="h-11 w-full border-none">
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
                                    {`${p.short_code ?? ''} ${p.short_code ? '-' : ''} ${p.product_presentation_name} `}   {`${p.bulk_quantity_equivalence && `X${p.bulk_quantity_equivalence}`}`}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* <Input
                className={`border border-gray-200 h-9 w-22 `}
                value={presentations.find((p) => p.product_presentation_id === value?.product_presentation_id)?.bulk_quantity_equivalence ?? ''}
                placeholder="Unidad/Kg por presentación"
                disabled

            /> */}

            {children}
        </>
    );
};

const CancelProductPresentationSelection = () => {
    const { value, onChange, onChangeCode } =
        useProductPresentationSelectorContext();

    return value && (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => {
                onChangeCode(null);
                onChange(null)
            }}
            className="text-red-500 hover:text-red-700 h-9"
        >
            <X className="w-5 h-5" />
        </Button>
    )

}

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
                        size={'icon'}
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5 " />
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
    CancelProductPresentationSelection,
};
