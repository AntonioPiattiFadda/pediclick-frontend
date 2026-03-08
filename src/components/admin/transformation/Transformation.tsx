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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { MoneyInput } from "@/components/admin/ui/MoneyInput"
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
import type { Location } from "@/types/locations"
import type { Lot } from "@/types/lots"
import type { ProductPresentation } from "@/types/productPresentation"
import type { Product } from "@/types/products"
import type { Transformation } from "@/types/transformation"
import type { TransformationItems } from "@/types/transformationItems"
import { formatDate } from "@/utils"
import { getLotData } from "@/utils/stock"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeftRight, PlusCircle, Trash } from "lucide-react"
import { useState } from "react"
import { createTransformation } from "@/service/transformations"
import { LocationSelectorRoot, SelectLocation } from "../selectors/locationSelector"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

// UI-only type: extends TransformationItems with a percentage field for TO items
type ToItem = TransformationItems & { percentage: number }

const generateNewFromItem = (
    newTransformationId: number,
    initialPresentation?: Pick<ProductPresentation, 'product_presentation_id' | 'product_presentation_name' | 'bulk_quantity_equivalence' | 'sell_unit' | 'auto_stock_calc' | 'lots' | 'product_id'>
): TransformationItems => ({
    transformation_item_id: Math.random(),
    transformation_id: newTransformationId,
    bulk_quantity_equivalence: initialPresentation?.bulk_quantity_equivalence ?? null,
    product_id: initialPresentation?.product_id ?? null,
    product_presentation_id: initialPresentation?.product_presentation_id ?? null,
    lot_id: null,
    stock_id: null,
    is_origin: true,
    quantity: null,
    quantity_in_base_units: null,
    max_quantity: null,
    product_presentation: initialPresentation ?? null,
    final_cost_per_unit: null,
    location_id: null,
    lot: null,
})

const generateNewToItem = (newTransformationId: number, percentage = 0): ToItem => ({
    transformation_item_id: Math.random(),
    transformation_id: newTransformationId,
    bulk_quantity_equivalence: null,
    product_id: null,
    product_presentation_id: null,
    lot_id: null,
    stock_id: null,
    is_origin: false,
    quantity: null,
    quantity_in_base_units: null,
    max_quantity: null,
    product: null,
    product_presentation: null,
    final_cost_per_unit: null,
    location_id: null,
    lot: null,
    percentage,
})

/**
 * Single source of truth for item cost:
 * cost = final_cost_per_unit (per base unit) × quantity_in_base_units
 */
const computeItemCost = (item: TransformationItems): number => {
    const qtyBase = item.quantity_in_base_units ?? ((item.quantity || 0) * (item.bulk_quantity_equivalence || 1))
    return (item.final_cost_per_unit || 0) * qtyBase
}

/**
 * Recomputes all TO item costs based on their current percentages and
 * the new totalToCost (= fromTotalCost + transformationCost).
 * Called on every change that affects costs.
 */
const recalcToItemCosts = (
    toItems: ToItem[],
    fromItems: TransformationItems[],
    transformationCost: number
): ToItem[] => {
    const newFromTotalCost = fromItems.reduce((acc, item) => acc + computeItemCost(item), 0)
    const newTotalToCost = newFromTotalCost + transformationCost
    return toItems.map(item => ({
        ...item,
        final_cost_total: newTotalToCost * (item.percentage / 100),
    }))
}

export function Transformation({
    isShortCut,
    disabled = false,
    initialPresentation,
}: {
    isShortCut?: boolean
    disabled?: boolean
    initialPresentation?: Pick<ProductPresentation, 'product_presentation_id' | 'product_presentation_name' | 'bulk_quantity_equivalence' | 'sell_unit' | 'auto_stock_calc' | 'lots' | 'product_id'>
}) {
    const [selectedLocation, setSelectedLocation] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null)

    const newTransformationId = Math.floor(Math.random() * 1000000)

    const [fromTransformationItems, setFromTransformationItems] = useState<TransformationItems[]>([
        generateNewFromItem(newTransformationId, initialPresentation)
    ])
    console.log("From items:", fromTransformationItems) // Debug log

    const [transformation, setTransformation] = useState<Omit<Transformation, 'created_at'>>({
        transformation_id: newTransformationId,
        transformation_cost: 0,
        notes: "",
        transformation_type: 'TRANSFORMATION',
    })

    const [toTransformationItems, setToTransformationItems] = useState<ToItem[]>([
        generateNewToItem(newTransformationId, 100)
    ])

    const showFromTrash = fromTransformationItems.length > 1
    const showToTrash = toTransformationItems.length > 1

    // Derived costs — computed from state, not stored
    const fromTotalCost = fromTransformationItems.reduce((acc, item) => acc + computeItemCost(item), 0)


    const totalToCost = fromTotalCost + transformation.transformation_cost

    // Percentage validation
    const toPercentageSum = toTransformationItems.reduce((acc, item) => acc + item.percentage, 0)
    const percentageExceeds100 = toPercentageSum > 100

    const handleResetTransformationItems = () => {
        setFromTransformationItems([generateNewFromItem(newTransformationId)])
        setToTransformationItems([generateNewToItem(newTransformationId, 100)])
    }

    const transformationMutation = useMutation({
        mutationFn: () => createTransformation(transformation, fromTransformationItems, toTransformationItems),
        onSuccess: () => {
            toast.success("Transformación creada correctamente")
            handleResetTransformationItems()
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al crear la transformación")
        },
    })

    const handleSubmit = () => {
        const missingFromFields = fromTransformationItems.some(
            item => !item.product_id || !item.product_presentation_id || !item.lot_id || !item.quantity
        )
        if (missingFromFields) {
            toast.error("Completá todos los campos de los ítems de origen")
            return
        }
        const missingToFields = toTransformationItems.some(
            item => !item.product_id || !item.product_presentation_id || !item.quantity
        )
        if (missingToFields) {
            toast.error("Completá todos los campos de los ítems de destino")
            return
        }
        if (percentageExceeds100) {
            toast.error("La suma de porcentajes no puede superar el 100%")
            return
        }
        transformationMutation.mutate()
    }

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    {isShortCut ? (
                        <SidebarMenuButton>Transformación</SidebarMenuButton>
                    ) : (
                        <Button
                            size="icon"
                            className="border border-gray-200"
                            disabled={disabled}
                            variant="outline"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>Transformacion</DialogTitle>
                        <DialogDescription>
                            Realiza transformaciones de productos aquí.
                        </DialogDescription>

                        <div className="w-80">
                            <Label>Ubicación</Label>
                            <LocationSelectorRoot
                                value={selectedLocation}
                                onChange={(location) => {
                                    setSelectedLocation(location)
                                    handleResetTransformationItems()
                                }}
                            >
                                <SelectLocation />
                            </LocationSelectorRoot>
                        </div>
                    </DialogHeader>

                    <div className="relative grid grid-cols-[1fr_auto_1fr] gap-2 border border-gray-200 rounded-lg">
                        {!selectedLocation && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg z-50">
                                <span className="text-gray-500">Selecciona una ubicación para continuar</span>
                            </div>
                        )}

                        {/* FROM column */}
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
                                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformation.transformation_cost))
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
                                                                // final_cost_per_unit stays from the lot (per base unit — unchanged by presentation)
                                                                quantity: null,
                                                                quantity_in_base_units: null,
                                                            }
                                                            : item
                                                    )
                                                    setFromTransformationItems(updatedDetails)
                                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformation.transformation_cost))
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
                                                        return recalcToItemCosts(withLot, updatedDetails, transformation.transformation_cost)
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
                                                        if (newValue > (maxQtyInBulkEqu)) {
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
                                                        // Update TO quantity via bulk equivalence, then recalc costs
                                                        const fromBulkEq = td.bulk_quantity_equivalence || 1
                                                        setToTransformationItems(prev => {
                                                            const withQty = prev.map((item, i) => {
                                                                if (i === index) {
                                                                    const toBulkEq = item.bulk_quantity_equivalence || 1
                                                                    return { ...item, quantity: (newValue * fromBulkEq) / toBulkEq }
                                                                }
                                                                return item
                                                            })
                                                            return recalcToItemCosts(withQty, updatedDetails, transformation.transformation_cost)
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
                                            {/* {td.quantity_in_base_units != null && (
                                                <span>Qty base: {td.quantity_in_base_units}</span>
                                            )} */}
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
                                                    setToTransformationItems(prev => recalcToItemCosts(prev, updatedDetails, transformation.transformation_cost))
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

                        {/* Middle column */}
                        <div className="p-4 border-r border-l border-gray-200 flex flex-col gap-2">
                            <MoneyInput
                                label="Costo de transformación"
                                disabled={!selectedLocation}
                                value={transformation.transformation_cost}
                                onChange={(newCost) => {
                                    const cost = newCost ?? 0
                                    setTransformation(prev => ({ ...prev, transformation_cost: cost }))
                                    setToTransformationItems(prev => recalcToItemCosts(prev, fromTransformationItems, cost))
                                }}
                            />
                            <Label>Notas</Label>
                            <Textarea
                                value={transformation.notes}
                                onChange={(e) => {
                                    setTransformation(prev => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))
                                }}
                            />
                        </div>

                        {/* TO column */}
                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Hacia:</span>
                                <div className="flex flex-col items-end text-sm text-gray-600">
                                    <span>Costo Total: ${totalToCost.toFixed(2)}</span>
                                    <span className={percentageExceeds100 ? "text-red-500 font-medium" : ""}>
                                        Porcentaje total sumado de items:  {percentageExceeds100 ? "⚠ " : ""}{toPercentageSum.toFixed(1)}%
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
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            disabled={transformationMutation.isLoading}
                            onClick={handleSubmit}
                        >
                            {transformationMutation.isLoading ? "Transformando..." : "Transformar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
