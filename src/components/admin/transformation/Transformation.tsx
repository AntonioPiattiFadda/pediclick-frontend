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
import { MoneyInput } from "@/components/admin/ui/MoneyInput"
import { Label } from "@/components/ui/label"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import type { Location } from "@/types/locations"
import type { ProductPresentation } from "@/types/productPresentation"
import type { Transformation } from "@/types/transformation"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeftRight } from "lucide-react"
import { useState } from "react"
import { createTransformation } from "@/service/transformations"
import { LocationSelectorRoot, SelectLocation } from "../selectors/locationSelector"
import toast from "react-hot-toast"
import { TransformationFromItems } from "./TransformationFromItems"
import { TransformationToItems } from "./TransformationToItems"
import { generateNewFromItem, generateNewToItem, distributeEquallyToItems, computeItemCost, type ToItem } from "@/utils/transformationUtils"
import type { TransformationItems } from "@/types/transformationItems"

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

    const [transformation, setTransformation] = useState<Omit<Transformation, 'created_at'>>({
        transformation_id: newTransformationId,
        transformation_cost: 0,
        notes: "",
        transformation_type: 'TRANSFORMATION',
        created_by: "",
    })

    const [toTransformationItems, setToTransformationItems] = useState<ToItem[]>([
        generateNewToItem(newTransformationId, 100)
    ])

    console.log("fromTransformationItems:", fromTransformationItems)
    console.log("toTransformationItems:", toTransformationItems)

    // Derived costs — computed from state, not stored
    const fromTotalCost = fromTransformationItems.reduce((acc, item) => {
        const qtyBase = item.quantity_in_base_units ?? ((item.quantity || 0) * (item.bulk_quantity_equivalence || 1))
        return acc + (item.final_cost_per_unit || 0) * qtyBase
    }, 0)
    const totalToCost = fromTotalCost + transformation.transformation_cost

    // Percentage validation
    const toPercentageSum = toTransformationItems.reduce((acc, item) => acc + item.percentage, 0)
    const percentageExceeds100 = toPercentageSum > 100

    const handleResetTransformationItems = () => {
        setFromTransformationItems([generateNewFromItem(newTransformationId)])
        setToTransformationItems([generateNewToItem(newTransformationId, 100)])
    }

    const transformationMutation = useMutation({
        mutationFn: () => createTransformation(transformation, fromTransformationItems, toTransformationItems, selectedLocation?.location_id || 0),
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

                        <TransformationFromItems
                            fromTransformationItems={fromTransformationItems}
                            setFromTransformationItems={setFromTransformationItems}
                            setToTransformationItems={setToTransformationItems}
                            selectedLocation={selectedLocation}
                            transformationCost={transformation.transformation_cost}
                            newTransformationId={newTransformationId}
                        />

                        {/* Middle column */}
                        <div className="p-4 border-r border-l border-gray-200 flex flex-col gap-2">
                            <MoneyInput
                                label="Costo de transformación"
                                disabled={!selectedLocation}
                                value={transformation.transformation_cost}
                                onChange={(newCost) => {
                                    const cost = newCost ?? 0
                                    setTransformation(prev => ({ ...prev, transformation_cost: cost }))
                                    const newTotalToCost = fromTransformationItems.reduce((acc, item) => acc + computeItemCost(item), 0) + cost
                                    setToTransformationItems(prev => distributeEquallyToItems(prev, newTotalToCost))
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

                        <TransformationToItems
                            toTransformationItems={toTransformationItems}
                            setToTransformationItems={setToTransformationItems}
                            selectedLocation={selectedLocation}
                            totalToCost={totalToCost}
                            newTransformationId={newTransformationId}
                            fromTransformationItems={fromTransformationItems}
                        />
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
