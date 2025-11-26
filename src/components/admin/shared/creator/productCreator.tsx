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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import {
    useState
} from "react";
import toast from "react-hot-toast";

import { Label } from "@/components/ui/label";
import { createProduct } from "@/service/products";
import type { Product } from "@/types/products";
import { BrandSelectorRoot, SelectBrand } from "../selectors/brandSelector";
import { CategorySelectorRoot, SelectCategory } from "../selectors/categorySelector";
import { IvaSelectorRoot, SelectIva } from "../selectors/ivaSelector";
import { SelectSubCategory, SubCategorySelectorRoot } from "../selectors/subCategorySelector";
import { ProviderSelectorRoot, SelectProvider } from "../selectors/providersSelector";
import type { Iva } from "@/types/iva";

// ---------- Context ----------
// interface ProductCreatorContextType {
//     onChange: (member: UserProfile | null) => void;
//     disabled: boolean;
//     shortCode: number | null;
//     onChangeShortCode: (code: number | null) => void;
// }

// const ProductCreatorContext =
//     createContext<ProductCreatorContextType | null>(null);

// function useProductCreatorContext() {
//     const ctx = useContext(TeamMemberCreatorContext);
//     if (!ctx)
//         throw new Error(
//             "ProductCreator components must be used inside Root"
//         );
//     return ctx;
// }

// ---------- Root ----------
// interface RootProps {
//     value: UserProfile | null;
//     onChange: (member: UserProfile | null) => void;
//     disabled?: boolean;
//     children: ReactNode;
//     storeId?: number | null;
//     shortCode?: number | null;
//     onChangeShortCode?: (code: number | null) => void;
// }

// const TeamMemberCreatorRoot = ({
//     value,
//     onChange,
//     disabled = false,
//     children,
//     storeId = null
// }: RootProps) => {


//     const [shortCode, setShortCode] = useState<number | null>(null);


//     return (
//         <TeamMemberCreatorContext.Provider
//             value={{
//                 onChange,
//                 disabled,
//                 shortCode,
//                 onChangeShortCode: setShortCode,
//             }}
//         >
//             <div className="flex items-center gap-2 w-full h-10">{children}</div>
//         </TeamMemberCreatorContext.Provider>
//     );
// };


// ---------- Create ----------
const CreateProductCreator = ({
    isShortCut = false,
    onChange,
    disabled
}: {
    isShortCut?: boolean,
    onChange: (member: Product) => void,
    disabled?: boolean
}) => {
    const queryClient = useQueryClient();

    const [newProductData, setNewProductData] = useState<Product>({} as Product);
    const [ivaSelected, setIvaSelected] = useState<Iva | null>({} as Iva);

    console.log(newProductData);

    // const [showPassword, setShowPassword] = useState(false);



    const [open, setOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            return await createProduct(newProductData);
        },
        onSuccess: (created: { data: Product }) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onChange(created.data);
            setOpen(false);

            if (isShortCut) toast("Producto creado", { icon: "✅" });
        },
        onError: (error: any) => {
            toast(error.message, { icon: "⚠️" });
        },
    });

    const handleCreate = async () => {
        if (!newProductData.product_name) return;
        await mutation.mutateAsync();
    };

    // const formattedLocationId = newTeamMemberData.store_id ? `store-${newTeamMemberData.store_id}` : newTeamMemberData.stock_room_id ? `stock-${newTeamMemberData.stock_room_id}` : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Producto</SidebarMenuButton>
                ) : (
                    <Button
                        size="icon"
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo producto</DialogTitle>
                    <DialogDescription>
                        Completá los datos para crear el producto.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label>Nombre</Label>
                    <Input
                        value={newProductData.product_name}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewProductData({ ...newProductData, product_name: e.target.value })}
                        placeholder="Nombre del producto"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Marca</Label>
                    <BrandSelectorRoot value={newProductData.brand_id?.toString() ?? ""}
                        onChange={(brandId) => setNewProductData({ ...newProductData, brand_id: Number(brandId) })}>
                        <SelectBrand />
                    </BrandSelectorRoot>
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Categoria</Label>
                    <CategorySelectorRoot value={newProductData.category_id} onChange={(categoryId) => setNewProductData({ ...newProductData, category_id: Number(categoryId) })}>
                        <SelectCategory />
                    </CategorySelectorRoot>
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Iva</Label>
                    <IvaSelectorRoot
                        value={ivaSelected}
                        // onChange={(ivaId) => {
                        //     setNewProductData({
                        //         ...newProductData,
                        //         iva_id: Number(ivaId?.iva_id),
                        //     });
                        // }}
                        onChange={(iva) => {
                            setIvaSelected(iva);
                            setNewProductData((prev) => ({
                                ...prev,
                                iva_id: iva?.iva_id ?? null, // si puede ser null
                            }));
                        }}                    >
                        <SelectIva />
                    </IvaSelectorRoot>
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Sub Categoria</Label>
                    <SubCategorySelectorRoot value={newProductData.sub_category_id} onChange={(subCategoryId) => setNewProductData({ ...newProductData, sub_category_id: Number(subCategoryId) })}>
                        <SelectSubCategory />
                    </SubCategorySelectorRoot>
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Proveedor</Label>
                    <ProviderSelectorRoot value={newProductData.provider_id} onChange={(providerId) => setNewProductData({ ...newProductData, provider_id: Number(providerId) })}>
                        <SelectProvider />
                    </ProviderSelectorRoot>
                </div>
                {/* 
                <div className="flex flex-col gap-2">
                    <Label>Código</Label>
                    <Input
                        value={newProductData.short_code}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewProductData({ ...newProductData, short_code: e.target.value })}
                        placeholder="Código"
                    />
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Descripción</Label>
                    <InputGroup>
                        <InputGroupInput
                            value={newProductData.product_description}
                            disabled={mutation.isLoading}
                            onChange={(e) => setNewProductData({ ...newProductData, product_description: e.target.value })}
                            placeholder="Descripción"
                        />
                        <InputGroupAddon align="inline-end">
                            <button className="cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <Eye className="size-5" /> : <EyeClosed className="size-5" />}
                            </button>

                        </InputGroupAddon>
                    </InputGroup>
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Código corto</Label>
                    <Input
                        value={newProductData.short_code ?? undefined}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewProductData({ ...newProductData, short_code: Number(e.target.value) })}
                        placeholder="Código corto"
                    />
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Asignación</Label>
                    <LocationsSelector
                        selectedLocationId={formattedLocationId}
                        onChangeSelectedLocation={(newLocationId, locationType) => {
                            if (locationType === "STORE") {
                                setNewProductData({ ...newProductData, store_id: newLocationId ?? 0, stock_room_id: null });
                            } else if (locationType === "STOCK_ROOM") {
                                setNewProductData({ ...newProductData, stock_room_id: newLocationId ?? 0, store_id: null });
                            }
                        }}
                        flexDirection="column"
                        label=''
                        placeholder=''
                    />
                </div> */}

                <DialogFooter>
                    <Button
                        disabled={mutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={
                            mutation.isLoading ||
                            !newProductData.product_name
                        }
                        onClick={handleCreate}
                    >
                        {mutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Exports ----------
export default CreateProductCreator;


