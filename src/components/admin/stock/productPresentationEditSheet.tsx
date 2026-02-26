import { useEffect, useState } from "react";
import type { ProductPresentation } from "@/types/productPresentation";
import type { SellType, SellUnit } from "@/types";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getProductPresentation, updateProductPresentation } from "@/service/productPresentations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface ProductPresentationEditSheetProps {
    presentation: ProductPresentation;
    onUpdated: () => void;
}

const emptyForm = {
    product_presentation_name: "",
    short_code: null as number | null,
    bulk_quantity_equivalence: null as number | null,
    sell_type: "MINOR" as SellType,
    sell_unit: "BY_UNIT" as SellUnit,
};

export function ProductPresentationEditSheet({ presentation, onUpdated }: ProductPresentationEditSheetProps) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const uid = presentation.product_presentation_id ?? "new";
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ["product_presentation", presentation.product_presentation_id],
        queryFn: async () => {
            const { presentation: fetched } = await getProductPresentation(presentation.product_presentation_id);
            return fetched;
        },
        enabled: open && !!presentation.product_presentation_id,
    });

    useEffect(() => {
        if (!data) return;
        setFormData({
            product_presentation_name: data.product_presentation_name ?? "",
            short_code: data.short_code ?? null,
            bulk_quantity_equivalence: data.bulk_quantity_equivalence ?? null,
            sell_type: (data.sell_type ?? "MINOR") as SellType,
            sell_unit: (data.sell_unit ?? "BY_UNIT") as SellUnit,
        });
    }, [data]);

    const handleSave = async () => {
        if (!presentation.product_presentation_id) return;
        try {
            setIsSaving(true);
            await updateProductPresentation(presentation.product_presentation_id, formData);

            await queryClient.invalidateQueries({ queryKey: ["product_presentation", presentation.product_presentation_id] });
            onUpdated();

            toast.success("Presentación actualizada correctamente.");
            setOpen(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Intentá nuevamente más tarde.";
            toast.error("Error al actualizar la presentación: " + message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Pencil className="w-4 h-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[425px]" side="right">
                <SheetHeader>
                    <SheetTitle>Modificar presentación</SheetTitle>
                    <SheetDescription>
                        Editá los datos de esta presentación del producto.
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="mt-4 text-sm text-muted-foreground">Cargando...</div>
                ) : (
                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="presentation_name">Nombre</Label>
                            <Input
                                id="presentation_name"
                                value={formData.product_presentation_name}
                                onChange={(e) => setFormData((p) => ({ ...p, product_presentation_name: e.target.value }))}
                                placeholder="Nombre de la presentación"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="short_code">Código corto</Label>
                            <Input
                                id="short_code"
                                type="number"
                                value={formData.short_code === null ? "" : String(formData.short_code)}
                                onChange={(e) => setFormData((p) => ({ ...p, short_code: e.target.value === "" ? null : Number(e.target.value) }))}
                                placeholder="Código corto"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="bulk_quantity_equivalence">Cantidad por bulto</Label>
                            <Input
                                id="bulk_quantity_equivalence"
                                type="number"
                                value={formData.bulk_quantity_equivalence === null ? "" : String(formData.bulk_quantity_equivalence)}
                                onChange={(e) => setFormData((p) => ({ ...p, bulk_quantity_equivalence: e.target.value === "" ? null : Number(e.target.value) }))}
                                placeholder="Unidad/Kg por presentación"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Tipo de venta</Label>
                            <RadioGroup
                                value={formData.sell_type}
                                onValueChange={(value) => setFormData((p) => ({ ...p, sell_type: value as SellType }))}
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="MINOR" id={`sell-type-minor-${uid}`} />
                                    <Label htmlFor={`sell-type-minor-${uid}`}>Minorista</Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="MAYOR" id={`sell-type-mayor-${uid}`} />
                                    <Label htmlFor={`sell-type-mayor-${uid}`}>Mayorista</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Unidad de venta</Label>
                            <RadioGroup
                                value={formData.sell_unit}
                                onValueChange={(value) => setFormData((p) => ({ ...p, sell_unit: value as SellUnit }))}
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="BY_UNIT" id={`sell-unit-byunit-${uid}`} />
                                    <Label htmlFor={`sell-unit-byunit-${uid}`}>Por unidad</Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="BY_WEIGHT" id={`sell-unit-byweight-${uid}`} />
                                    <Label htmlFor={`sell-unit-byweight-${uid}`}>Por peso</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                <SheetFooter className="mt-6">
                    <SheetClose asChild>
                        <Button variant="outline" disabled={isSaving}>Cancelar</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={isSaving || isLoading || !formData.product_presentation_name}>
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
