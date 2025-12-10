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
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/types/products"
import type { Transformation } from "@/types/transformation"
import type { TransformationItems } from "@/types/transformationItems"
import { PlusCircle, Rotate3d, Trash } from "lucide-react"
import { useEffect, useState } from "react"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { formatDate } from "@/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createTransformation } from "@/service/transformations"
import { toast } from "sonner"
import type { Lot } from "@/types/lots"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { LocationSelectorRoot, SelectLocation } from "../selectors/locationSelector"
import type { Location } from "@/types/locations"
import { useGetLocationId } from "@/hooks/useGetLocationId"

const generateNewTransformationItems = (isOrigin: boolean, newTransformationId: number) => {
    return {
        transformation_item_id: Math.random(),
        transformation_id: newTransformationId,

        bulk_quantity_equivalence: null,

        product_id: null,
        product_presentation_id: null,
        lot_id: null,
        stock_id: null,

        is_origin: isOrigin,
        quantity: null,
        max_quantity: null,
        product: null,
        product_presentation: null,
        final_cost_per_unit: null,
        final_cost_per_bulk: null,
        final_cost_total: null,

        location_id: null,
        lot: null,
    }
}

export function Transformation({
    initialFromTransformationDetails,
    isFraction,
    isShortCut,
    disabled = false
}: {
    initialFromTransformationDetails?: TransformationItems,
    isFraction?: boolean
    isShortCut?: boolean
    disabled?: boolean
}) {
    const selectedLocationId = useGetLocationId().locationId

    const [selectedLocation, setSelectedLocation] = useState<Partial<Location> | null>(selectedLocationId ? {
        location_id: selectedLocationId,
    } : null);

    console.log("🟢 selectedLocation:", selectedLocation);

    const queryClient = useQueryClient();

    const newTransformationId = Math.floor(Math.random() * 1000000);

    const getInitialFromTransformationDetails: TransformationItems = generateNewTransformationItems(true, newTransformationId);

    const getInitialToTransformationDetails: TransformationItems = generateNewTransformationItems(false, newTransformationId);

    const [fromTransformationItems, setFromTransformationItems] = useState<TransformationItems[]>(
        [{ ...getInitialFromTransformationDetails }]
    )

    const [transformation, setTransformation] = useState<Omit<Transformation, 'created_at'>>({
        transformation_id: newTransformationId,
        transformation_cost: 0,
        notes: "",
    } as Transformation)

    const [toTransformationItems, setToTransformationItems] = useState<TransformationItems[]>([
        {
            ...getInitialToTransformationDetails
        }
    ])

    useEffect(() => {
        if (initialFromTransformationDetails) {
            setFromTransformationItems([
                initialFromTransformationDetails
            ]);
            setToTransformationItems([
                {
                    ...initialFromTransformationDetails,
                    transformation_item_id: Math.random(),
                    transformation_id: newTransformationId,
                    is_origin: false,
                    quantity: 0,
                }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialFromTransformationDetails?.product_id, initialFromTransformationDetails?.product_presentation_id]);

    const createTransformationMutation = useMutation({
        mutationFn: async () => {
            return await createTransformation(transformation, fromTransformationItems, toTransformationItems);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Transformacion:", data)
            queryClient.invalidateQueries({ queryKey: ["product_presentations", initialFromTransformationDetails?.product_id] })
            toast.success("Transformación creada con éxito")

        },
        onError: (e) => {
            console.error("Error hacer la transformación", e)
            toast.error("Error al hacer la transformación")
        },
    })

    const showFromTrash = fromTransformationItems.length > 1;
    const showToTrash = toTransformationItems.length > 1;

    const fromTotalCost = fromTransformationItems.reduce((acc, detail) => acc + ((detail?.final_cost_per_unit || 0) * (detail?.quantity || 0)), 0);

    const fromTotalQty = fromTransformationItems.reduce((acc, detail) => acc + (detail.quantity || 0), 0);

    const [toTotalCost, setToTotalCost] = useState(0)

    const getLotData = (lots: Lot[], lotId: number | null) => {
        console.log("lots:", lots);
        console.log("lotId:", lotId);

        let lot;

        if (lotId) {
            lot = lots.find((l) => l.lot_id === lotId);

        } else {
            lot = lots[0];
        }

        const lotStock = lot?.stock?.find((s) => Number(s.location_id) === Number(selectedLocation?.location_id));

        const max_quantity = lotStock ? Number(lotStock.quantity) - (lotStock?.reserved_for_selling_quantity ?? 0) - (lotStock?.reserved_for_transferring_quantity ?? 0) : null;

        return {
            lot_id: lot?.lot_id || null,
            final_cost_per_unit: lot?.final_cost_per_unit || null,
            final_cost_per_bulk: lot?.final_cost_per_bulk || null,
            final_cost_total: lot?.final_cost_total || null,
            stock_id: lotStock?.stock_id || null,
            max_quantity: max_quantity,
        }
    }

    const handleUpdateToQuantity = (index: number, newQuantity: number) => {
        const fromQty = newQuantity;
        const fromBulkEq = fromTransformationItems[index]?.bulk_quantity_equivalence || 1;

        const toBulkEq = toTransformationItems[index]?.bulk_quantity_equivalence || 1;

        const toQty = (fromQty * fromBulkEq) / toBulkEq;
        const updatedToTransformationItems = [...toTransformationItems];
        updatedToTransformationItems[index] = {
            ...updatedToTransformationItems[index],
            quantity: toQty,
        };
        setToTransformationItems(updatedToTransformationItems);
    };

    if (isFraction) {

        return <Dialog open={disabled ? false : undefined} >
            <form>
                <DialogTrigger asChild>
                    <Button disabled={disabled} size='icon'>
                        <Rotate3d />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[90vw]">
                    <DialogHeader>
                        <DialogTitle>Fracciones</DialogTitle>
                        <DialogDescription>
                            Realiza fracciones de productos aquí.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border border-gray-200 rounded-lg ">

                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex justify-between">
                                <span className="col-span-6">Desde:</span>
                                {/* <div className="flex gap-2">
                                    <span>Costo Total: ${fromTotalCost}</span>
                                    <span>Cantitad Total: {fromTotalQty}</span>
                                </div> */}
                            </div>
                            {fromTransformationItems.map((td, index) => {
                                const locationLots =
                                    td.product_presentation?.lots?.filter((lot: Lot) =>
                                        lot.stock?.some((s) => Number(s.location_id) === Number(selectedLocation?.location_id))
                                    ) || [];
                                return (<div
                                    key={td.transformation_item_id}
                                    className="grid grid-cols-6
                                    gap-2"
                                >
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Producto Nro: {index + 1}</Label>
                                        <ProductSelector
                                            value={td.product ?? {} as Product}
                                            onChange={
                                                (product: Product) => {
                                                    const productIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                    const updatedDetails = [...fromTransformationItems];
                                                    updatedDetails[productIndex] = {
                                                        ...updatedDetails[productIndex],
                                                        product_id: product?.product_id || null,
                                                        product: product,
                                                    };
                                                    setFromTransformationItems(updatedDetails);

                                                }}
                                        />
                                    </div>
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Presentación</Label>
                                        <ProductPresentationSelectorRoot
                                            productId={td.product_id}
                                            value={td.product_presentation}
                                            onChange={(presentation) => {
                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const firstLotData = getLotData(presentation?.lots || [], null);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: firstLotData.lot_id || null,
                                                    lot: firstLotData,
                                                    stock_id: firstLotData.stock_id || null,
                                                    max_quantity: firstLotData.max_quantity || null,
                                                    product_presentation_id: presentation?.product_presentation_id ?? null,
                                                    product_presentation: presentation,
                                                    bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                };

                                                setFromTransformationItems(updatedFromTransformationItems);

                                                setToTransformationItems((prev) => {
                                                    const updatedToItems = [...prev];
                                                    updatedToItems[index] = {
                                                        ...updatedToItems[index],
                                                        quantity: 0,
                                                    };
                                                    return updatedToItems;
                                                }
                                                );


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
                                                const lotData = getLotData(td.product_presentation?.lots || [], Number(value));
                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: Number(value),
                                                    stock_id: lotData.stock_id || null,
                                                    max_quantity: lotData.max_quantity || null,
                                                    final_cost_total: lotData.final_cost_total || 0,
                                                    final_cost_per_bulk: lotData.final_cost_per_bulk || 0,
                                                    final_cost_per_unit: lotData.final_cost_per_unit || 0,
                                                };
                                                setFromTransformationItems(updatedFromTransformationItems);

                                                const updatedToTransformationItems = [...toTransformationItems];
                                                updatedToTransformationItems[index] = {
                                                    ...updatedToTransformationItems[index],
                                                    lot: lotData || null,
                                                };
                                                setToTransformationItems(updatedToTransformationItems);
                                            }
                                            } >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona el lote" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Lotes</SelectLabel>
                                                    {locationLots.map((lot) => (
                                                        <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDate(lot.created_at || '')}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-1 col-span-2">
                                        <Label>Cantidad</Label>
                                        <InputGroup>
                                            <InputGroupInput
                                                placeholder="Cantidad"
                                                type="number"
                                                value={td.quantity ?? ''}
                                                onChange={(e) => {
                                                    const newValue = Number((e.target as HTMLInputElement).value);
                                                    if (newValue > (td.max_quantity || 0)) {
                                                        toast.error(`La cantidad no puede ser mayor a la cantidad máxima disponible: ${td.max_quantity}`);
                                                        return
                                                    }
                                                    setFromTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: newValue } : item));
                                                    handleUpdateToQuantity(index, newValue);
                                                }} />
                                            {/* <InputGroupAddon>
                                                <Search />
                                            </InputGroupAddon> */}
                                            <InputGroupAddon align="inline-end">/ {td.max_quantity}</InputGroupAddon>
                                        </InputGroup>

                                    </div>

                                    {/* {showFromTrash && (
                                        <Button
                                            variant="outline"
                                            size={'icon'}
                                            onClick={() => {
                                                setFromTransformationItems((prev) =>
                                                    prev.filter((item) => item.transformation_item_id !== td.transformation_item_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )} */}
                                </div>)
                            }

                            )}

                            {/* <Button variant="outline" size={'icon'} onClick={() => {
                                setFromTransformationItems((prev) => [...prev, generateNewTransformationItems(true, newTransformationId)]);
                            }}>
                                <PlusCircle size={16} />
                            </Button> */}

                        </div>

                        <div className=" border-r border-l border-gray-200  flex flex-col gap-2">
                            {/* <Label>Costo de transformación</Label>
                            <Input value={transformation.transformation_cost} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, transformation_cost: Number((e.target as HTMLInputElement).value) }));
                            }} />
                            <Label>Notas</Label>
                            <Textarea value={transformation.notes} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }));
                            }} /> */}
                        </div>

                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex justify-between">
                                <span className="col-span-6">Hacia:</span>
                                {/* <div className="flex gap-2">
                                    <span>Costo Total: ${fromTotalCost}</span>
                                    <span>Cantitad Total: {fromTotalQty}</span>
                                </div> */}
                            </div>
                            {toTransformationItems.map((td, index) => {

                                return (<div
                                    key={td.transformation_item_id}
                                    className="grid grid-cols-6
                                    gap-2"
                                >
                                    {/* {td.lot && <div className="col-span-6 flex gap-2">
                                        <Label>Lote: SI</Label>
                                        <span>{td.lot?.created_at}</span>
                                    </div>} */}
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Producto Nro: {index + 1}</Label>
                                        <ProductSelector
                                            disabled={true}
                                            value={td.product ?? {} as Product}
                                            onChange={
                                                (product: Product) => {
                                                    const productIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                    const updatedDetails = [...toTransformationItems];
                                                    updatedDetails[productIndex] = {
                                                        ...updatedDetails[productIndex],
                                                        product_id: product?.product_id || null,
                                                        product: product,
                                                        quantity: 0,
                                                    };
                                                    setToTransformationItems(updatedDetails);

                                                }}
                                        />
                                    </div>
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Presentación</Label>
                                        <ProductPresentationSelectorRoot
                                            productId={td.product_id}
                                            value={td.product_presentation}

                                            onChange={(presentation) => {
                                                const toTransformationItemsIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedToTransformationItemss = [...toTransformationItems];
                                                updatedToTransformationItemss[toTransformationItemsIndex] = {
                                                    ...updatedToTransformationItemss[toTransformationItemsIndex],
                                                    product_presentation_id: presentation?.product_presentation_id ?? null,
                                                    product_presentation: presentation,
                                                    bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                    quantity: 0,
                                                };

                                                setToTransformationItems(updatedToTransformationItemss);

                                            }}
                                            isFetchWithLots={true}
                                        >
                                            <SelectProductPresentation />
                                        </ProductPresentationSelectorRoot>
                                    </div>

                                    {/* <div className="flex flex-col gap-1  col-span-2">
                                        <Label>Lote</Label>
                                        <Select
                                            value={td.lot_id ? String(td.lot_id) : undefined}
                                            onValueChange={(value) => {
                                                console.log("🟢 value del lote seleccionado:", value);
                                                const availableLots = td.product_presentation?.lots || [];
                                                const selectedLot = availableLots.find((lot) => String(lot.lot_id) === value);
                                                console.log("🟢 selectedLot:", selectedLot);
                                                const lotStock = selectedLot?.stock?.find((s) => Number(s.location_id) === Number(selectedLocationId));
                                                const max_quantity = lotStock ? Number(lotStock.quantity) - (lotStock?.reserved_for_selling_quantity ?? 0) - (lotStock?.reserved_for_transferring_quantity ?? 0) : null;
                                                console.log("🟢 max_quantity:", max_quantity);
                                                //                                              final_cost_per_unit: 200,
                                                //                                              final_cost_per_bulk: 200,
                                                // final_cost_per_unit: 0.5,

                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: Number(value),
                                                    stock_id: lotStock?.stock_id || null,
                                                    max_quantity: max_quantity,
                                                    final_cost_total: selectedLot ? selectedLot.final_cost_total || 0 : 0,
                                                    final_cost_per_bulk: selectedLot ? selectedLot.final_cost_per_bulk || 0 : 0,
                                                    final_cost_per_unit: selectedLot ? selectedLot.final_cost_per_unit || 0 : 0,

                                                };
                                                setFromTransformationItems(updatedFromTransformationItems);
                                            }
                                            } >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona el lote" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Lotes</SelectLabel>
                                                    {locationLots.map((lot) => (
                                                        <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDate(lot.created_at || '')}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div> */}

                                    <div className="flex flex-col gap-1">
                                        <Label>Cantidad</Label>
                                        <Input
                                            placeholder="Cantidad"
                                            type="number"
                                            value={td.quantity ?? ''}
                                            onChange={(e) => {
                                                setToTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: Number((e.target as HTMLInputElement).value) } : item));
                                            }}
                                        />
                                    </div>

                                    {/* {showFromTrash && (
                                        <Button
                                            variant="outline"
                                            size={'icon'}
                                            onClick={() => {
                                                setFromTransformationItems((prev) =>
                                                    prev.filter((item) => item.transformation_item_id !== td.transformation_item_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )} */}
                                </div>)
                            }

                            )}

                            {/* <Button variant="outline" size={'icon'} onClick={() => {
                                setFromTransformationItems((prev) => [...prev, generateNewTransformationItems(true, newTransformationId)]);
                            }}>
                                <PlusCircle size={16} />
                            </Button> */}

                        </div>

                    </div>
                    <DialogFooter>

                        <Button
                            disabled={createTransformationMutation.isPending}
                            onClick={() => {
                                createTransformationMutation.mutate();
                            }}
                        >
                            {createTransformationMutation.isPending ? 'Creando...' : 'Crear Transformación'}

                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog >
    }

    return (
        <Dialog >
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
                            <PlusCircle className="w-5 h-5" />
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>Transformacion</DialogTitle>
                        <DialogDescription>
                            Realiza transformaciones de productos aquí.
                        </DialogDescription>

                        <LocationSelectorRoot
                            value={selectedLocation}
                            onChange={(location) => {
                                setSelectedLocation(location);
                            }}>
                            <SelectLocation />
                        </LocationSelectorRoot>
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

                            {fromTransformationItems.map((td, index) => {
                                const locationLots =
                                    td.product_presentation?.lots?.filter((lot: Lot) =>
                                        lot.stock?.some((s) => Number(s.location_id) === Number(selectedLocation?.location_id))
                                    ) || [];
                                return (<div
                                    key={td.transformation_item_id}
                                    className="grid grid-cols-6
                                    gap-2"
                                >
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Producto Nro: {index + 1}</Label>
                                        <ProductSelector
                                            disabled={!selectedLocation}
                                            value={td.product ?? {} as Product}
                                            onChange={
                                                (product: Product) => {
                                                    const productIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                    const updatedDetails = [...fromTransformationItems];
                                                    updatedDetails[productIndex] = {
                                                        ...updatedDetails[productIndex],
                                                        product_id: product?.product_id || null,
                                                        product: product,
                                                    };
                                                    setFromTransformationItems(updatedDetails);

                                                }}
                                        />
                                    </div>
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Presentación</Label>
                                        <ProductPresentationSelectorRoot
                                            disabled={!selectedLocation}
                                            productId={td.product_id}
                                            value={td.product_presentation}
                                            onChange={(presentation) => {
                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const firstLotData = getLotData(presentation?.lots || [], null);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: firstLotData.lot_id || null,
                                                    lot: firstLotData,
                                                    stock_id: firstLotData.stock_id || null,
                                                    max_quantity: firstLotData.max_quantity || null,
                                                    product_presentation_id: presentation?.product_presentation_id ?? null,
                                                    product_presentation: presentation,
                                                    bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                };

                                                setFromTransformationItems(updatedFromTransformationItems);

                                                setToTransformationItems((prev) => {
                                                    const updatedToItems = [...prev];
                                                    updatedToItems[index] = {
                                                        ...updatedToItems[index],
                                                        quantity: 0,
                                                    };
                                                    return updatedToItems;
                                                }
                                                );


                                            }}
                                            isFetchWithLots={true}
                                        >
                                            <SelectProductPresentation />
                                        </ProductPresentationSelectorRoot>
                                    </div>


                                    <div className="flex flex-col gap-1  col-span-2">
                                        <Label>Lote</Label>
                                        <Select
                                            disabled={!selectedLocation}
                                            value={td.lot_id ? String(td.lot_id) : undefined}
                                            onValueChange={(value) => {
                                                const lotData = getLotData(td.product_presentation?.lots || [], Number(value));
                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: Number(value),
                                                    stock_id: lotData.stock_id || null,
                                                    max_quantity: lotData.max_quantity || null,
                                                    final_cost_total: lotData.final_cost_total || 0,
                                                    final_cost_per_bulk: lotData.final_cost_per_bulk || 0,
                                                    final_cost_per_unit: lotData.final_cost_per_unit || 0,
                                                };
                                                setFromTransformationItems(updatedFromTransformationItems);

                                                const updatedToTransformationItems = [...toTransformationItems];
                                                updatedToTransformationItems[index] = {
                                                    ...updatedToTransformationItems[index],
                                                    lot: lotData || null,
                                                };
                                                setToTransformationItems(updatedToTransformationItems);
                                            }
                                            } >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona el lote" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Lotes</SelectLabel>
                                                    {locationLots.map((lot) => (
                                                        <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDate(lot.created_at || '')}</SelectItem>
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
                                                    const newValue = Number((e.target as HTMLInputElement).value);
                                                    if (newValue > (td.max_quantity || 0)) {
                                                        toast.error(`La cantidad no puede ser mayor a la cantidad máxima disponible: ${td.max_quantity}`);
                                                        return
                                                    }
                                                    setFromTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: newValue } : item));
                                                    handleUpdateToQuantity(index, newValue);
                                                }} />
                                            {/* <InputGroupAddon>
                                                <Search />
                                            </InputGroupAddon> */}
                                            <InputGroupAddon align="inline-end">/ {td.max_quantity}</InputGroupAddon>
                                        </InputGroup>

                                    </div>

                                    {showFromTrash && (
                                        <Button
                                            variant="outline"
                                            size={'icon'}
                                            disabled={!selectedLocation}
                                            onClick={() => {
                                                setFromTransformationItems((prev) =>
                                                    prev.filter((item) => item.transformation_item_id !== td.transformation_item_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )}
                                </div>)
                            }

                            )}

                            <Button
                                disabled={!selectedLocation}
                                variant="outline"
                                size={'icon'}
                                onClick={() => {
                                    setFromTransformationItems((prev) => [...prev, generateNewTransformationItems(true, newTransformationId)]);
                                }}>
                                <PlusCircle size={16} />
                            </Button>

                        </div>

                        <div className="p-4 border-r border-l border-gray-200  flex flex-col gap-2">
                            <Label>Costo de transformación</Label>
                            <Input
                                value={transformation.transformation_cost}
                                onChange={(e) => {
                                    setTransformation((prev) => ({ ...prev, transformation_cost: Number((e.target as HTMLInputElement).value) }));
                                }} />
                            <Label>Notas</Label>
                            <Textarea
                                value={transformation.notes}
                                onChange={(e) => {
                                    setTransformation((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }));
                                }} />
                        </div>

                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex justify-between">
                                <span className="col-span-6">Desde:</span>
                                <div className="flex gap-2">
                                    <span>Costo Total: ${toTotalCost}</span>
                                    {/* <span>Cantitad Total: {fromTotalQty}</span> */}
                                </div>
                            </div>

                            {toTransformationItems.map((td, index) => {
                                return (<div
                                    key={td.transformation_item_id}
                                    className="grid grid-cols-6
                                    gap-2"
                                >

                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Producto Nro: {index + 1}</Label>
                                        <ProductSelector
                                            disabled={!selectedLocation}
                                            value={td.product ?? {} as Product}
                                            onChange={
                                                (product: Product) => {
                                                    const productIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                    const updatedDetails = [...toTransformationItems];
                                                    updatedDetails[productIndex] = {
                                                        ...updatedDetails[productIndex],
                                                        product_id: product?.product_id || null,
                                                        product: product,
                                                        quantity: 0,
                                                    };
                                                    setToTransformationItems(updatedDetails);
                                                }}
                                        />
                                    </div>
                                    <div className="col-span-3  flex flex-col gap-1">
                                        <Label>Presentación</Label>
                                        <ProductPresentationSelectorRoot
                                            disabled={!selectedLocation}
                                            productId={td.product_id}
                                            value={td.product_presentation}
                                            onChange={(presentation) => {
                                                const toTransformationItemsIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedToTransformationItemss = [...toTransformationItems];
                                                updatedToTransformationItemss[toTransformationItemsIndex] = {
                                                    ...updatedToTransformationItemss[toTransformationItemsIndex],
                                                    product_presentation_id: presentation?.product_presentation_id ?? null,
                                                    product_presentation: presentation,
                                                    bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                    quantity: 0,
                                                };

                                                setToTransformationItems(updatedToTransformationItemss);

                                            }}
                                            isFetchWithLots={true}
                                        >
                                            <SelectProductPresentation />
                                        </ProductPresentationSelectorRoot>
                                    </div>

                                    {/* <div className="flex flex-col gap-1  col-span-2">
                                        <Label>Lote</Label>
                                        <Select
                                            value={td.lot_id ? String(td.lot_id) : undefined}
                                            onValueChange={(value) => {
                                                console.log("🟢 value del lote seleccionado:", value);
                                                const availableLots = td.product_presentation?.lots || [];
                                                const selectedLot = availableLots.find((lot) => String(lot.lot_id) === value);
                                                console.log("🟢 selectedLot:", selectedLot);
                                                const lotStock = selectedLot?.stock?.find((s) => Number(s.location_id) === Number(selectedLocationId));
                                                const max_quantity = lotStock ? Number(lotStock.quantity) - (lotStock?.reserved_for_selling_quantity ?? 0) - (lotStock?.reserved_for_transferring_quantity ?? 0) : null;
                                                console.log("🟢 max_quantity:", max_quantity);
                                                //                                              final_cost_per_unit: 200,
                                                //                                              final_cost_per_bulk: 200,
                                                // final_cost_per_unit: 0.5,

                                                const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                                const updatedFromTransformationItems = [...fromTransformationItems];
                                                updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                    ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                    lot_id: Number(value),
                                                    stock_id: lotStock?.stock_id || null,
                                                    max_quantity: max_quantity,
                                                    final_cost_total: selectedLot ? selectedLot.final_cost_total || 0 : 0,
                                                    final_cost_per_bulk: selectedLot ? selectedLot.final_cost_per_bulk || 0 : 0,
                                                    final_cost_per_unit: selectedLot ? selectedLot.final_cost_per_unit || 0 : 0,

                                                };
                                                setFromTransformationItems(updatedFromTransformationItems);
                                            }
                                            } >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona el lote" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Lotes</SelectLabel>
                                                    {locationLots.map((lot) => (
                                                        <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDate(lot.created_at || '')}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div> */}

                                    <div className="flex flex-col gap-1">
                                        <Label>Cantidad</Label>
                                        <Input
                                            disabled={!selectedLocation}
                                            placeholder="Cantidad"
                                            type="number"
                                            value={td.quantity ?? ''}
                                            onChange={(e) => {
                                                setToTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: Number((e.target as HTMLInputElement).value) } : item));
                                            }}
                                        />
                                    </div>

                                    {showToTrash && (
                                        <Button
                                            disabled={!selectedLocation}
                                            variant="outline"
                                            size={'icon'}
                                            onClick={() => {
                                                setFromTransformationItems((prev) =>
                                                    prev.filter((item) => item.transformation_item_id !== td.transformation_item_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )}

                                </div>)
                            }

                            )}
                            <Button
                                disabled={!selectedLocation}
                                variant="outline"
                                size={'icon'}
                                onClick={() => {
                                    setToTransformationItems((prev) => [...prev, generateNewTransformationItems(true, newTransformationId)]);
                                }}>
                                <PlusCircle size={16} />
                            </Button>
                        </div>

                    </div>
                    <DialogFooter>

                        <Button type="submit">Transformar</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog >
    )
}
