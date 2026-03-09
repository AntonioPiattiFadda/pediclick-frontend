import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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
import type { Location } from "@/types/locations"
import type { Lot } from "@/types/lots"
import type { Product } from "@/types/products"
import type { TransformationItems } from "@/types/transformationItems"
import { formatDate } from "@/utils"
import { getLotData } from "@/utils/stock"
import { PlusCircle, Trash } from "lucide-react"
import toast from "react-hot-toast"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { computeItemCost, generateNewFromItem, recalcToItemCosts, type ToItem } from "@/utils/transformationUtils"

interface TransformationFromItemsProps {
    fromTransformationItems: TransformationItems[]
    setFromTransformationItems: React.Dispatch<React.SetStateAction<TransformationItems[]>>
    setToTransformationItems: React.Dispatch<React.SetStateAction<ToItem[]>>
    selectedLocation: Pick<Location, 'location_id' | 'name' | 'type'> | null
    transformationCost: number
    newTransformationId: number
}

export function TransformationFromItems({
    fromTransformationItems,
    setFromTransformationItems,
    setToTransformationItems,
    selectedLocation,
    transformationCost,
    newTransformationId,
}: TransformationFromItemsProps) {
    const showFromTrash = fromTransformationItems.length > 1
    const fromTotalCost = fromTransformationItems.reduce((acc, item) => acc + computeItemCost(item), 0)

    return (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium">Desde:</span>
                <div className="flex flex-col items-end text-sm text-gray-600">
                    <span>Costo Total: ${fromTotalCost.toFixed(2)}</span>
                </div>
            </div>

            {fromTransformationItems.map((td, index) => {
                console.log(`Rendering FROM item ${index}:`, td) // Debug log
                const locationLots = td.product_presentation?.lots?.filter((lot: Lot) =>
                    lot.stock?.some((s) => Number(s.location_id) === Number(selectedLocation?.location_id))
                ) || []
                console.log(`Location lots for item ${index}:`, locationLots) // Debug log
                const itemCost = computeItemCost(td)
                const maxQtyInBulkEqu = td.max_quantity ? td.max_quantity / (td.bulk_quantity_equivalence || 1) : 0

                return (
                    <div key={td.transformation_item_id} className="grid grid-cols-6 gap-2">
                        <div className="col-span-3 flex flex-col gap-1">
                            <Label>Producto Nro: {index + 1}</Label>
                            <ProductSelector
                                disabled={!selectedLocation}
                                value={td.product ?? {} as Pick<Product, "product_id" | "product_name" | "short_code" | 'updated_at'>}
                                onChange={(product: Product) => {
                                    const updatedDetails = fromTransformationItems.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? { ...item, product_id: product?.product_id || null, product }
                                            : item
                                    )
                                    setFromTransformationItems(updatedDetails)
                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformationCost))
                                }}
                            />
                        </div>

                        <div className="col-span-3 flex flex-col gap-1">
                            <Label>Presentación</Label>
                            <ProductPresentationSelectorRoot
                                locationId={selectedLocation?.location_id || null}
                                disabled={!selectedLocation}
                                productId={td.product_id}
                                value={td.product_presentation}
                                onChange={(presentation) => {
                                    console.log("Selected presentation:", presentation) // Debug log
                                    const updatedDetails = fromTransformationItems.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? {
                                                ...item,
                                                product_presentation_id: presentation?.product_presentation_id ?? null,
                                                product_presentation: presentation,
                                                bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                quantity: null,
                                                quantity_in_base_units: null,
                                            }
                                            : item
                                    )
                                    setFromTransformationItems(updatedDetails)
                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformationCost))
                                }}
                                isFetchWithLots={true}
                            >
                                <SelectProductPresentation />
                            </ProductPresentationSelectorRoot>
                        </div>

                        <div className="flex flex-col gap-1 col-span-2">
                            <Label>Lote</Label>
                            <Select
                                disabled={!selectedLocation}
                                value={td.lot_id ? String(td.lot_id) : undefined}
                                onValueChange={(value) => {
                                    const lotData = getLotData(td.product_presentation?.lots || [], Number(value), Number(selectedLocation?.location_id))
                                    const updatedDetails = fromTransformationItems.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? {
                                                ...item,
                                                lot_id: Number(value),
                                                stock_id: lotData.stock_id || null,
                                                max_quantity: lotData.max_quantity || null,
                                                final_cost_total: lotData.final_cost_total || 0,
                                                final_cost_per_bulk: lotData.final_cost_per_bulk || 0,
                                                final_cost_per_unit: lotData.final_cost_per_unit || 0,
                                            }
                                            : item
                                    )
                                    setFromTransformationItems(updatedDetails)
                                    setToTransformationItems(prev => {
                                        const withLot = prev.map((item, i) =>
                                            i === index ? { ...item, lot: lotData || null } : item
                                        )
                                        return recalcToItemCosts(withLot, updatedDetails, transformationCost)
                                    })
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona el lote" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Lotes</SelectLabel>
                                        {locationLots.map((lot) => (
                                            <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>
                                                {formatDate(lot.created_at || '')}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 col-span-2">
                            <Label>Cantidad</Label>
                            <InputGroup>
                                <InputGroupInput
                                    disabled={!selectedLocation}
                                    placeholder="Cantidad"
                                    type="number"
                                    value={td.quantity ?? ''}
                                    onChange={(e) => {
                                        const newValue = Number((e.target as HTMLInputElement).value)
                                        if (newValue > maxQtyInBulkEqu) {
                                            toast.error(`La cantidad no puede ser mayor a la cantidad máxima disponible: ${maxQtyInBulkEqu}`)
                                            return
                                        }
                                        const updatedDetails = fromTransformationItems.map(item =>
                                            item.transformation_item_id === td.transformation_item_id
                                                ? {
                                                    ...item,
                                                    quantity: newValue,
                                                    quantity_in_base_units: newValue * (item.bulk_quantity_equivalence || 1),
                                                }
                                                : item
                                        )
                                        setFromTransformationItems(updatedDetails)
                                        const fromBulkEq = td.bulk_quantity_equivalence || 1
                                        setToTransformationItems(prev => {
                                            const withQty = prev.map((item, i) => {
                                                if (i === index) {
                                                    const toBulkEq = item.bulk_quantity_equivalence || 1
                                                    return { ...item, quantity: (newValue * fromBulkEq) / toBulkEq }
                                                }
                                                return item
                                            })
                                            return recalcToItemCosts(withQty, updatedDetails, transformationCost)
                                        })
                                    }}
                                />
                                <InputGroupAddon align="inline-end">
                                    {td.max_quantity != null && (
                                        <span className="text-xs text-gray-500">
                                            {maxQtyInBulkEqu} {td.product_presentation?.sell_unit === 'BY_UNIT' ? 'Un' : 'Kg'}
                                        </span>
                                    )}
                                </InputGroupAddon>
                            </InputGroup>
                        </div>

                        {/* Item cost display (read-only) */}
                        <div className="col-span-6 flex justify-between text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            <span>
                                Costo/{td.product_presentation?.product_presentation_name ?? 'u'}: ${((td.final_cost_per_unit || 0) * (td.bulk_quantity_equivalence || 1)).toFixed(2)}
                            </span>
                            <span>Total: ${itemCost.toFixed(2)}</span>
                        </div>

                        {showFromTrash && (
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={!selectedLocation}
                                onClick={() => {
                                    const updatedDetails = fromTransformationItems.filter(
                                        item => item.transformation_item_id !== td.transformation_item_id
                                    )
                                    setFromTransformationItems(updatedDetails)
                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformationCost))
                                }}
                            >
                                <Trash size={16} />
                            </Button>
                        )}
                    </div>
                )
            })}

            <Button
                disabled={!selectedLocation}
                variant="outline"
                size="icon"
                onClick={() => {
                    setFromTransformationItems(prev => [...prev, generateNewFromItem(newTransformationId)])
                }}
            >
                <PlusCircle size={16} />
            </Button>
        </div>
    )
}
