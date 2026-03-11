import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import type { Location } from "@/types/locations"
import type { Product } from "@/types/products"
import { ArrowDownToLine, PlusCircle, Trash } from "lucide-react"
import { MoneyInput } from "@/components/admin/ui/MoneyInput"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { generateNewToItem, type ToItem } from "@/utils/transformationUtils"
import { formatCurrency } from "@/utils/prices"
import { useState } from "react"
import type { TransformationItems } from "@/types/transformationItems"


interface TransformationToItemsProps {
    toTransformationItems: ToItem[]
    setToTransformationItems: React.Dispatch<React.SetStateAction<ToItem[]>>
    selectedLocation: Pick<Location, 'location_id' | 'name' | 'type'> | null
    totalToCost: number
    newTransformationId: number
    fromTransformationItems: TransformationItems[]
}

type QuantityStatus = 'under' | 'exact' | 'over'

interface QuantityStatusResult {
    status: QuantityStatus
    diffPresentations: number
    presentationName: string
    bulkEq: number
    unit: string
    maxQuantity: number
}

function getQuantityStatus(
    toItem: ToItem,
    fromItems: TransformationItems[]
): QuantityStatusResult | null {
    if (!toItem.product_id) return null
    const matchingFrom = fromItems.filter(item => item.product_id === toItem.product_id)
    if (matchingFrom.length === 0) return null

    const fromBaseUnits = matchingFrom.reduce((acc, item) => {
        return acc + (item.quantity_in_base_units ?? ((item.quantity || 0) * (item.bulk_quantity_equivalence || 1)))
    }, 0)

    const bulkEq = toItem.bulk_quantity_equivalence || 1
    const toBaseUnits = (toItem.quantity || 0) * bulkEq
    const diff = toBaseUnits - fromBaseUnits
    const unit = toItem.product_presentation?.sell_unit === 'BY_UNIT' ? 'un' : 'kg'
    const presentationName = toItem.product_presentation?.product_presentation_name ?? 'presentación'
    const maxQuantity = Math.floor(fromBaseUnits / bulkEq)

    if (Math.abs(diff) < 0.001) return { status: 'exact', diffPresentations: 0, presentationName, bulkEq, unit, maxQuantity }
    return {
        status: diff < 0 ? 'under' : 'over',
        diffPresentations: Math.floor(Math.abs(diff) / bulkEq),
        presentationName,
        bulkEq,
        unit,
        maxQuantity,
    }
}

export function TransformationToItems({
    toTransformationItems,
    setToTransformationItems,
    selectedLocation,
    totalToCost,
    newTransformationId,
    fromTransformationItems,
}: TransformationToItemsProps) {
    const [percentageInputs, setPercentageInputs] = useState<Record<number, string>>({})

    const showToTrash = toTransformationItems.length > 1
    const toPercentageSum = toTransformationItems.reduce((acc, item) => acc + item.percentage, 0)
    const percentageExceeds100 = toPercentageSum > 100

    return (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium">Hacia:</span>
                <div className="flex flex-col items-end text-sm text-gray-600">
                    <span>Costo Total: {formatCurrency(totalToCost)}</span>
                    <span className={
                        percentageExceeds100 ? "text-red-500 font-medium" :
                        Math.abs(toPercentageSum - 100) < 0.01 ? "text-green-600 font-medium" :
                        "text-yellow-600 font-medium"
                    }>
                        {percentageExceeds100 ? "⚠ " : Math.abs(toPercentageSum - 100) < 0.01 ? "✓ " : "⚠ "}
                        Porcentaje total: {toPercentageSum.toFixed(1)}%
                    </span>
                </div>
            </div>

            {toTransformationItems.map((td, index) => {
                const quantityStatus = getQuantityStatus(td, fromTransformationItems)
                return (<div key={td.transformation_item_id} className="grid grid-cols-6 gap-2 py-4 border-b border-gray-400">
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
                                value={percentageInputs[td.transformation_item_id] ?? (td.percentage === 0 ? '' : String(td.percentage))}
                                onChange={(e) => {
                                    const raw = (e.target as HTMLInputElement).value
                                    // Allow digits, comma and dot, max 2 decimals
                                    if (!/^(\d{0,3}([.,]\d{0,2})?)?$/.test(raw)) return
                                    setPercentageInputs(prev => ({ ...prev, [td.transformation_item_id]: raw }))
                                    const numPct = parseFloat(raw.replace(',', '.')) || 0
                                    const newCost = parseFloat((totalToCost * (numPct / 100)).toFixed(2))
                                    setToTransformationItems(prev =>
                                        prev.map(item =>
                                            item.transformation_item_id === td.transformation_item_id
                                                ? { ...item, percentage: numPct, final_cost_total: newCost, final_cost_per_unit: newCost }
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
                                const newPct = parseFloat((totalToCost > 0 ? (cost / totalToCost) * 100 : 0).toFixed(2))
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
                        <div className="flex gap-1">
                        <Input
                            disabled={!selectedLocation}
                            placeholder="Cantidad"
                            type="number"
                            step="any"
                            min={0}
                            value={td.quantity === null || td.quantity === undefined ? '' : String(td.quantity)}
                            onChange={(e) => {
                                const rawValue = (e.target as HTMLInputElement).value
                                const parsed = parseFloat(rawValue)
                                const newValue = isNaN(parsed) ? null : parsed
                                setToTransformationItems(prev =>
                                    prev.map(item =>
                                        item.transformation_item_id === td.transformation_item_id
                                            ? { ...item, quantity: newValue ?? 0 }
                                            : item
                                    )
                                )
                            }}
                        />
                        {quantityStatus && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={!selectedLocation}
                                title="Autocompletar cantidad máxima"
                                onClick={() => {
                                    setToTransformationItems(prev =>
                                        prev.map(item =>
                                            item.transformation_item_id === td.transformation_item_id
                                                ? { ...item, quantity: quantityStatus.maxQuantity }
                                                : item
                                        )
                                    )
                                }}
                            >
                                <ArrowDownToLine size={16} />
                            </Button>
                        )}
                        </div>
                        {quantityStatus && (
                            quantityStatus.status === 'exact' ? (
                                <span className="text-xs text-green-600">✓ Cantidad coincide con el origen</span>
                            ) : quantityStatus.status === 'under' ? (
                                <span className="text-xs text-yellow-600">
                                    ⚠ Te quedan {quantityStatus.diffPresentations} {quantityStatus.presentationName} de {quantityStatus.bulkEq} {quantityStatus.unit}
                                </span>
                            ) : (
                                <span className="text-xs text-red-600">
                                    ✗ Sobre-transformación: excede por {quantityStatus.diffPresentations} {quantityStatus.presentationName} de {quantityStatus.bulkEq} {quantityStatus.unit}
                                </span>
                            )
                        )}
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
                )
            })}

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
