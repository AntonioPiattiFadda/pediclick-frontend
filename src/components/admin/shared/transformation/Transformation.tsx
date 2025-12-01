

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/types/products"
import type { Transformation } from "@/types/transformation"
import type { TransformationItems } from "@/types/transformationItems"
import { formatDateToDDMMYY } from "@/utils"
import { PlusCircle, Trash } from "lucide-react"
import { useState } from "react"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"

const generateNewTransformationItems = (isOrigin: boolean, newTransformationId: number) => {
    return {
        transformation_detail_id: Math.random(),
        transformation_id: newTransformationId,
        lot_id: null,
        product_id: null,
        is_origin: isOrigin,
        product_presentation_id: null,
        quantity: null,
        product: null,
        product_presentation: null,
        final_cost_per_unit: null,
        final_cost_per_bulk: null,
        final_cost_total: null,
    }
}

export function Transformation() {
    const newTransformationId = Math.floor(Math.random() * 1000000);

    const initialFromTranformationDetails: TransformationItems = generateNewTransformationItems(true, newTransformationId);

    const initialToTranformationDetails: TransformationItems = generateNewTransformationItems(false, newTransformationId);

    const [fromTransformationItemss, setFromTransformationItemss] = useState<TransformationItems[]>([
        { ...initialFromTranformationDetails }
    ])

    console.log(fromTransformationItemss);

    const [transformation, setTransformation] = useState<Omit<Transformation, 'created_at'>>({
        transformation_id: newTransformationId,
        transformation_date: new Date().toISOString().split('T')[0],
        transformation_cost: 0,
        notes: "",
    } as Transformation)

    const [toTransformationItemss, setToTransformationItemss] = useState<TransformationItems[]>([
        {
            ...initialToTranformationDetails
        }
    ])

    const showFromTrash = fromTransformationItemss.length > 1;
    const showToTrash = toTransformationItemss.length > 1;

    const fromTotalCost = fromTransformationItemss.reduce((acc, detail) => acc + (detail?.final_cost_per_unit * detail?.quantity || 0), 0);
    const fromTotalQty = fromTransformationItemss.reduce((acc, detail) => acc + (detail.quantity || 0), 0);

    console.log(showToTrash, setToTransformationItemss);

    return (
        <Dialog >
            <form>
                <DialogTrigger asChild>
                    <SidebarMenuButton>Transformacion</SidebarMenuButton>
                </DialogTrigger>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>Transformacion</DialogTitle>
                        <DialogDescription>
                            Realiza transformaciones de productos aquí.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border border-gray-200 rounded-lg">

                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex justify-between">
                                <span className="col-span-6">Desde:</span>
                                <div className="flex gap-2">
                                    <span>Costo Total: ${fromTotalCost}</span>
                                    <span>Cantitad Total: {fromTotalQty}</span>
                                </div>
                            </div>
                            {fromTransformationItemss.map((td, index) => (
                                <div
                                    key={td.transformation_detail_id}
                                    className="grid grid-cols-6
                                    gap-2"
                                >
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Producto Nro: {index + 1}</Label>
                                        <ProductSelector
                                            value={td.product ?? {} as Product}
                                            onChange={
                                                (product: Product) => {
                                                    const productIndex = fromTransformationItemss.findIndex((item) => item.transformation_detail_id === td.transformation_detail_id);
                                                    const updatedDetails = [...fromTransformationItemss];
                                                    updatedDetails[productIndex] = {
                                                        ...updatedDetails[productIndex],
                                                        product_id: product?.product_id || null,
                                                        product: product,
                                                    };
                                                    setFromTransformationItemss(updatedDetails);

                                                }}
                                        />
                                    </div>
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Presentación</Label>
                                        <ProductPresentationSelectorRoot
                                            productId={td.product_id}
                                            value={td.product_presentation}
                                            onChange={(presentation) => {
                                                const fromTransformationItemsIndex = fromTransformationItemss.findIndex((item) => item.transformation_detail_id === td.transformation_detail_id);

                                                const updatedFromTransformationItemss = [...fromTransformationItemss];
                                                updatedFromTransformationItemss[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItemss[fromTransformationItemsIndex],
                                                    product_presentation_id: presentation?.product_presentation_id ?? null,
                                                    product_presentation: presentation,
                                                };

                                                setFromTransformationItemss(updatedFromTransformationItemss);

                                            }}
                                            isFetchWithLots={true}
                                        >
                                            <SelectProductPresentation />
                                        </ProductPresentationSelectorRoot>
                                    </div>


                                    <div className="flex flex-col gap-1  col-span-2">
                                        <Label>Lote</Label>
                                        <Select
                                            value={td.lot_id ? String(td.lot_id) : undefined}
                                            onValueChange={(value) => {
                                                console.log("🟢 value del lote seleccionado:", value);
                                                const availableLots = td.product_presentation?.lots || [];
                                                const selectedLot = availableLots.find((lot) => String(lot.lot_id) === value);
                                                console.log("🟢 selectedLot:", selectedLot);
                                                //                                              final_cost_per_unit: 200,
                                                //                                              final_cost_per_bulk: 200,
                                                // final_cost_per_unit: 0.5,

                                                const fromTransformationItemsIndex = fromTransformationItemss.findIndex((item) => item.transformation_detail_id === td.transformation_detail_id);

                                                const updatedFromTransformationItemss = [...fromTransformationItemss];
                                                updatedFromTransformationItemss[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItemss[fromTransformationItemsIndex],
                                                    lot_id: Number(value),
                                                    final_cost_total: selectedLot ? selectedLot.final_cost_total || 0 : 0,
                                                    final_cost_per_bulk: selectedLot ? selectedLot.final_cost_per_bulk || 0 : 0,
                                                    final_cost_per_unit: selectedLot ? selectedLot.final_cost_per_unit || 0 : 0,

                                                };
                                                setFromTransformationItemss(updatedFromTransformationItemss);
                                            }
                                            } >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona el lote" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Lotes</SelectLabel>
                                                    {td.product_presentation?.lots?.map((lot) => (
                                                        <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDateToDDMMYY(lot.created_at || '')}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Label>Cantidad</Label>
                                        <Input
                                            placeholder="Cantidad"
                                            type="number"
                                            value={td.quantity ?? ''}
                                            onChange={(e) => {
                                                setFromTransformationItemss((prev) => prev.map((item) => item.transformation_detail_id === td.transformation_detail_id ? { ...item, quantity: Number((e.target as HTMLInputElement).value) } : item));
                                            }} />
                                    </div>

                                    {showFromTrash && (
                                        <Button
                                            variant="outline"
                                            size={'icon'}
                                            onClick={() => {
                                                setFromTransformationItemss((prev) =>
                                                    prev.filter((item) => item.transformation_detail_id !== td.transformation_detail_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" size={'icon'} onClick={() => {
                                setFromTransformationItemss((prev) => [...prev, generateNewTransformationItems(true, newTransformationId)]);
                            }}>
                                <PlusCircle size={16} />
                            </Button>

                        </div>

                        <div className="p-4 border-r border-l border-gray-200  flex flex-col gap-2">
                            <Label>Costo de transformación</Label>
                            <Input value={transformation.transformation_cost} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, transformation_cost: Number((e.target as HTMLInputElement).value) }));
                            }} />
                            <Label>Notas</Label>
                            <Textarea value={transformation.notes} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }));
                            }} />
                        </div>

                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4"></div>

                    </div>
                    <DialogFooter>

                        <Button type="submit">Transformar</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog >
    )
}
