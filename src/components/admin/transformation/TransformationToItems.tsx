import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import type { Location } from "@/types/locations"
import type { Product } from "@/types/products"
import { PlusCircle, Trash } from "lucide-react"
import { MoneyInput } from "@/components/admin/ui/MoneyInput"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { generateNewToItem, type ToItem } from "@/utils/transformationUtils"

interface TransformationToItemsProps {
    toTransformationItems: ToItem[]
    setToTransformationItems: React.Dispatch<React.SetStateAction<ToItem[]>>
    selectedLocation: Pick<Location, 'location_id' | 'name' | 'type'> | null
    totalToCost: number
    newTransformationId: number
}

export function TransformationToItems({
    toTransformationItems,
    setToTransformationItems,
    selectedLocation,
    totalToCost,
    newTransformationId,
}: TransformationToItemsProps) {
    const showToTrash = toTransformationItems.length > 1
    const toPercentageSum = toTransformationItems.reduce((acc, item) => acc + item.percentage, 0)
    const percentageExceeds100 = toPercentageSum > 100

    return (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium">Hacia:</span>
                <div className="flex flex-col items-end text-sm text-gray-600">
                    <span>Costo Total: ${totalToCost.toFixed(2)}</span>
                    <span className={percentageExceeds100 ? "text-red-500 font-medium" : ""}>
                        Porcentaje total sumado de items: {percentageExceeds100 ? "⚠ " : ""}{toPercentageSum.toFixed(1)}%
                    </span>
                </div>
            </div>

            {toTransformationItems.map((td, index) => (
                <div key={td.transformation_item_id} className="grid grid-cols-6 gap-2 py-4 border-b border-gray-400">
                    <div className="col-span-3 flex flex-col gap-1">
                        <Label>Producto Nro: {index + 1}</Label>
                        <ProductSelector
                            disabled={!selectedLocation}
                            value={td.product ?? {} as Product}
                            onChange={(product: Product) => {
                                setToTransformationItems(prev =>
                                    prev.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? { ...item, product_id: product?.product_id || null, product, quantity: 0 }
                                            : item
                                    )
                                )
                            }}
                        />
                    </div>

                    <div className="col-span-3 flex flex-col gap-1">
                        <Label>Presentación</Label>
                        <ProductPresentationSelectorRoot
                            locationId={null}
                            disabled={!selectedLocation}
                            productId={td.product_id}
                            value={td.product_presentation}
                            onChange={(presentation) => {
                                setToTransformationItems(prev =>
                                    prev.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? {
                                                ...item,
                                                product_presentation_id: presentation?.product_presentation_id ?? null,
                                                product_presentation: presentation,
                                                bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                quantity: 0,
                                            }
                                            : item
                                    )
                                )
                            }}
                            isFetchWithLots={true}
                        >
                            <SelectProductPresentation />
                        </ProductPresentationSelectorRoot>
                    </div>

                    {/* Percentage input */}
                    <div className="col-span-3 flex flex-col gap-1">
                        <Label>Porcentaje</Label>
                        <InputGroup>
                            <InputGroupInput
                                disabled={!selectedLocation}
                                type="number"
                                min={0}
                                max={100}
                                value={td.percentage}
                                onChange={(e) => {
                                    const newPct = Number((e.target as HTMLInputElement).value)
                                    setToTransformationItems(prev =>
                                        prev.map(item =>
                                            item.transformation_item_id === td.transformation_item_id
                                                ? { ...item, percentage: newPct, final_cost_total: totalToCost * (newPct / 100) }
                                                : item
                                        )
                                    )
                                }}
                            />
                            <InputGroupAddon align="inline-end">%</InputGroupAddon>
                        </InputGroup>
                    </div>

                    {/* Cost input */}
                    <div className="col-span-3">
                        <MoneyInput
                            label="Costo"
                            disabled={!selectedLocation}
                            value={td.final_cost_per_unit ?? null}
                            onChange={(newCost) => {
                                const cost = newCost ?? 0
                                const newPct = totalToCost > 0 ? (cost / totalToCost) * 100 : 0
                                setToTransformationItems(prev =>
                                    prev.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? { ...item, final_cost_per_unit: cost, percentage: newPct }
                                            : item
                                    )
                                )
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1 col-span-6">
                        <Label>Cantidad</Label>
                        <Input
                            disabled={!selectedLocation}
                            placeholder="Cantidad"
                            type="number"
                            value={td.quantity ?? ''}
                            onChange={(e) => {
                                setToTransformationItems(prev =>
                                    prev.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? { ...item, quantity: Number((e.target as HTMLInputElement).value) }
                                            : item
                                    )
                                )
                            }}
                        />
                    </div>

                    {showToTrash && (
                        <Button
                            disabled={!selectedLocation}
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setToTransformationItems(prev =>
                                    prev.filter(item => item.transformation_item_id !== td.transformation_item_id)
                                )
                            }}
                        >
                            <Trash size={16} />
                        </Button>
                    )}
                </div>
            ))}

            <Button
                disabled={!selectedLocation}
                variant="outline"
                size="icon"
                onClick={() => {
                    setToTransformationItems(prev => [...prev, generateNewToItem(newTransformationId, 0)])
                }}
            >
                <PlusCircle size={16} />
            </Button>
        </div>
    )
}
