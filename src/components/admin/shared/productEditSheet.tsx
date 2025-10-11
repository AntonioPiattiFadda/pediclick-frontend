import { useEffect, useState } from "react";
import type { Product } from "@/types/products";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageSelector } from "../stock/addEditProduct/ImageSelector";
import { adaptProductForDb } from "@/adapters/products";
import { getProduct, updateProduct } from "@/service/products";
import { toast } from "sonner";
import { CategorySelectorRoot, CreateCategory, SelectCategory } from "./categorySelector";
import { BrandSelectorRoot, CreateBrand, SelectBrand } from "./brandSelector";
import { CreateSubCategory, SelectSubCategory, SubCategorySelectorRoot } from "./subCategorySelector";
import ShortCodeSelector from "./shortCodeSelector";

interface ProductEditSheetProps {
    product: Product;
    onUpdated: (updated: Product) => void;
}

export function ProductEditSheet({ product, onUpdated }: ProductEditSheetProps) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    console.log("ProductEditSheet product", product);

    const [formData, setFormData] = useState<Partial<Product>>({
        product_id: product.product_id,
        product_name: product.product_name ?? "",
        short_code: product.short_code ?? null,
        product_description: product.product_description ?? "",
        category_id: product.category_id ?? null,
        sub_category_id: product.sub_category_id ?? null,
        brand_id: product.brand_id ?? null,
        barcode: product.barcode ?? null,
        public_image_id: product.public_image_id ?? null,
        observations: product.observations ?? "",
        sell_measurement_mode: product.sell_measurement_mode ?? "QUANTITY",
        allow_stock_control: product.allow_stock_control ?? false,
        lot_control: product.lot_control ?? false,
    });

    useEffect(() => {
        setFormData({
            product_id: product.product_id,
            product_name: product.product_name ?? "",
            short_code: product.short_code ?? null,
            product_description: product.product_description ?? "",
            category_id: product.category_id ?? null,
            sub_category_id: product.sub_category_id ?? null,
            brand_id: product.brand_id ?? null,
            barcode: product.barcode ?? null,
            public_image_id: product.public_image_id ?? null,
            observations: product.observations ?? "",
            sell_measurement_mode: product.sell_measurement_mode ?? "QUANTITY",
            allow_stock_control: product.allow_stock_control ?? false,
            lot_control: product.lot_control ?? false,
        })

    }, [product]);

    const canEdit = Boolean(product?.product_id);

    const handleSave = async () => {
        if (!product?.product_id) return;
        try {
            setIsSaving(true);
            const completedInformation = adaptProductForDb(formData);
            await updateProduct(product.product_id!, completedInformation);

            const { product: refreshed } = await getProduct(product.product_id!);
            onUpdated(refreshed);

            toast("Producto actualizado exitosamente", {
                description: "Los cambios impactan en todos los lotes del producto.",
            });
            setOpen(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Intentá nuevamente más tarde.";
            toast("Error al actualizar el producto", {
                description: message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button disabled={!canEdit}>Modificar producto</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[640px] max-h-screen overflow-y-auto" side="right">
                <SheetHeader>
                    <SheetTitle>Modificar producto</SheetTitle>
                    <SheetDescription>
                        Esta edición afectará a todos los lotes de este producto, incluidos los creados anteriormente.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <ShortCodeSelector
                            productId={formData?.product_id ?? undefined}
                            value={formData?.short_code ?? null}
                            onChange={(value) =>
                                setFormData((p) => ({
                                    ...p,
                                    short_code: value === "" ? null : Number(value),
                                }))
                            }
                        />
                        {/* <div className="flex flex-col gap-2">
                            <Label htmlFor="short_code">Código corto</Label>
                            <Input
                                id="short_code"
                                type="number"
                                placeholder="Código corto"
                                value={formData.short_code ?? ""}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        short_code: e.target.value === "" ? null : Number(e.target.value),
                                    }))
                                }
                            />
                        </div> */}

                        <div className="flex flex-col gap-2">
                            <Label className="flex gap-2" htmlFor="barcode">
                                Código de barras
                            </Label>
                            <Input
                                id="barcode"
                                type="number"
                                placeholder="Código de barras"
                                value={formData.barcode ?? ""}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        barcode: e.target.value === "" ? null : Number(e.target.value),
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="category">Rubro</Label>
                            <CategorySelectorRoot disabled={false}
                                value={formData.category_id ?? null}
                                onChange={(id) =>
                                    setFormData((p) => ({
                                        ...p,
                                        category_id: id,
                                    }))
                                }
                            >
                                <SelectCategory />
                                <CreateCategory />
                            </CategorySelectorRoot>

                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="sub_category">Categoría</Label>
                            <SubCategorySelectorRoot disabled={false}
                                value={formData.sub_category_id?.toString() ?? ""}
                                onChange={(id) =>
                                    setFormData((p) => ({
                                        ...p,
                                        sub_category_id: id ? Number(id) : null,
                                    }))
                                }>
                                <SelectSubCategory />
                                <CreateSubCategory />
                            </SubCategorySelectorRoot>

                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <Label htmlFor="brand">Marca</Label>
                            <BrandSelectorRoot disabled={false}
                                value={formData.brand_id?.toString() ?? ""}
                                onChange={(id) =>
                                    setFormData((p) => ({
                                        ...p,
                                        brand_id: id ? Number(id) : null,
                                    }))
                                }>
                                <SelectBrand />
                                <CreateBrand />
                            </BrandSelectorRoot>
                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <Label htmlFor="product_name">Nombre</Label>
                            <Input
                                id="product_name"
                                type="text"
                                placeholder="Nombre del producto"
                                value={formData.product_name}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        product_name: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <Label htmlFor="observations">Observaciones</Label>
                            <Textarea
                                id="observations"
                                placeholder=""
                                value={formData.observations ?? ""}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        observations: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <ImageSelector
                        selectedImageId={formData.public_image_id as number | null}
                        onImageSelect={(id) =>
                            setFormData((p) => ({
                                ...p,
                                public_image_id: id ? Number(id) : null,
                            }))
                        }
                        onImageRemove={() =>
                            setFormData((p) => ({
                                ...p,
                                public_image_id: null,
                            }))
                        }
                    />
                </div>

                <SheetFooter className="mt-6">
                    <SheetClose asChild>
                        <Button variant="outline" disabled={isSaving}>Cancelar</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={isSaving || !canEdit}>
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}