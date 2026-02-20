import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { MovementStatus } from "@/types";
import type { Lot } from "@/types/lots";
import type { Product } from "@/types/products";
import type { Stock } from "@/types/stocks";
import type { TransferOrderItem } from "@/types/transferOrderItems";
import { formatDate, generateTempNumericId } from "@/utils";
import { getLotData } from "@/utils/stock";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { emptyProduct } from "../../../../components/admin/emptyFormData";
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../../../../components/admin/selectors/productPresentationSelector";
import ProductSelector from "../../../../components/admin/selectors/productSelector";
import { StockLocationTableCell } from "./StockLocationTableCell";

export default function TransferOrderItemsTable({
    transferOrderItems,
    onChangeTransferOrderItems,
    isTransferring,
    isEditing,
    isReadOnly,
    transferOrderId,
    fromLocationId
}: {
    transferOrderItems: TransferOrderItem[];
    onChangeTransferOrderItems: (updatedItems: TransferOrderItem[]) => void;
    isTransferring: boolean;
    isEditing: boolean;
    isReadOnly: boolean;
    transferOrderId: number;
    fromLocationId: number | null;
}) {



    const handleAddElement = () => {
        const newItem: TransferOrderItem = {
            transfer_order_item_id: generateTempNumericId(),
            transfer_order_id: transferOrderId,
            product_id: null,
            product_presentation_id: null,
            lot_containers_location_id: null,
            lot_containers_movement_id: null,
            lot_id: null,
            quantity: 0,
            is_deleted: false,
            is_new: true,
            is_transferred: false,
            status: 'PENDING' as MovementStatus,
            stock_id: null,
            // lot_containers_movement: [
            //     {
            //         quantity: 0,
            //         lot_container_status: "PENDING",
            //     },
            // ],
            product: emptyProduct,
            // lot_containers_stock: {
            //     lot_container_stock_id: null,
            //     lot_container_id: null,
            //     quantity: null,
            // },

        };

        const newItems = [...transferOrderItems, newItem];

        onChangeTransferOrderItems(newItems);
    };

    const handleRemoveItem = (itemId: number | undefined) => {
        if (itemId === undefined) return;
        if (isTransferring) return;
        const isItemNew = transferOrderItems?.find((item) => item.transfer_order_item_id === itemId)?.is_new;
        if (isItemNew) {
            const updatedItems = transferOrderItems?.filter((item) => item.transfer_order_item_id !== itemId);
            onChangeTransferOrderItems(updatedItems);
        } else {
            const updatedItems = transferOrderItems?.map((item) =>
                item.transfer_order_item_id === itemId
                    ? {
                        ...item,
                        is_deleted: true,
                    }
                    : item
            );
            onChangeTransferOrderItems(updatedItems);
        }
    };

    const handleSelectProduct = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transfer_order_item_id: any,
        product: Pick<Product, "product_id" | "product_name" | "short_code" | 'updated_at'>,
    ) => {

        if (isTransferring) return;
        console.log("🟢 transferOrderItems:", transferOrderItems.length);

        const updatedItemsIndex = transferOrderItems?.findIndex((item =>
            item.transfer_order_item_id === transfer_order_item_id
        ));
        if (updatedItemsIndex === undefined || updatedItemsIndex === -1) return;

        const updatedItems = transferOrderItems.map((item, index) =>
            index === updatedItemsIndex
                ? {
                    ...item,
                    product: product,
                    product_id: product.product_id || null,
                    updated_at: product?.updated_at || null,
                }
                : item
        );
        onChangeTransferOrderItems(updatedItems);
        // onChangeTransferOrderItems((prev: OrderItem[]) => {
        //     return prev.map((item, index) =>
        //         index === updatedItemsIndex
        //             ? {
        //                 ...item,
        //                 product: product,
        //                 product_id: product.product_id || null,
        //                 sell_measurement_mode: product?.sell_measurement_mode || null,
        //                 updated_at: product?.updated_at || null,
        //             }
        //             : item
        //     );
        // })
    };

    const lotIdForProductPresentationForProductExists = (productId: number | null, presentationId: number | null, lotId: number | null) => {
        const exists = transferOrderItems?.filter((item) => !item.is_deleted)
            .some(
                (item) =>
                    item.product_id === productId &&
                    item.product_presentation_id === presentationId
                    && item.lot_id === lotId
            );
        const product_presentation_name = transferOrderItems?.find(
            (item) =>
                item.product_id === productId &&
                item.product_presentation_id === presentationId
        )?.product_presentation?.product_presentation_name || '';
        return {
            exists,
            product_presentation_name: product_presentation_name
        }
    };

    return (
        <div className="rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Producto</TableHead>
                        <TableHead className="w-[120px]">Stock disponible</TableHead>
                        <TableHead className="w-40">Cantidad</TableHead>
                        {/* <TableHead className="w-40">Vacíos</TableHead> */}
                        {(!isTransferring && !isReadOnly) && (
                            <TableHead className="w-40">Lote</TableHead>
                        )}
                        {/* {isTransferring && (
                            <TableHead className="w-40">Transferido</TableHead>
                        )} */}
                        {(!isTransferring && !isReadOnly) && (
                            <TableHead className="text-right w-10">Acciones</TableHead>
                        )}

                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(transferOrderItems).length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center align-middle">No hay ítems en la orden de transferencia.</TableCell>
                        </TableRow>
                    )}
                    {(transferOrderItems)
                        .filter(item => !item.is_deleted)
                        .map((row) => {
                            const rowLots = row.product_presentation?.lots || [];

                            const selectedLot = rowLots.find((lot: Lot) => lot.lot_id === row.lot_id);

                            const filteredStocks = selectedLot?.stock?.filter((stock: Stock) => {
                                return stock.location_id === fromLocationId;
                            }) || [];

                            // Mutations
                            // const selectedLotLotContainerLocation = filteredStocks[0]?.lot_containers_location
                            // const selectedLotLotContainerLocation = {
                            //     lot_containers_location_id: filteredStocks[0]?.lot_containers_location?.lot_containers_location_id || null,
                            //     lot_container_id: filteredStocks[0]?.lot_containers_location?.lot_container_id || null,
                            //     quantity: filteredStocks[0]?.lot_containers_location?.quantity || null,
                            // }

                            // console.log("🟢 selectedLotLotContainerLocation:", selectedLotLotContainerLocation);

                            // const maxLotContainerLocationQty = selectedLotLotContainerLocation?.quantity || 0;
                            // console.log("🟢 maxLotContainerLocationQty:", maxLotContainerLocationQty);

                            const maxQtyInFromLocation = filteredStocks.reduce((acc: number, stock: Stock) => {
                                // Here you would check if the stock's location matches the transfer order's from location
                                // For simplicity, we sum all stock quantities
                                return acc + (stock.quantity || 0);
                            }, 0) || 0;

                            return (<TableRow key={row.transfer_order_item_id}>
                                <TableCell className="align-top w-[50%]">
                                    <div className="relative flex gap-1">

                                        <ProductSelector
                                            value={row.product || emptyProduct}
                                            onChange={(p) => {
                                                if (isReadOnly || (isEditing && !row.is_new)) return;


                                                handleSelectProduct(row.transfer_order_item_id, {
                                                    product_name: p.product_name,
                                                    product_id: p.product_id,
                                                    short_code: p.short_code,
                                                    updated_at: p.updated_at,
                                                })
                                            }}
                                            disabled={isTransferring || isReadOnly || (isEditing && !row.is_new)}
                                        />
                                        <ProductPresentationSelectorRoot
                                            locationId={Number(fromLocationId)}
                                            productId={row?.product_id}
                                            value={row?.product_presentation || null}
                                            onChange={(selectedProductPresentation) => {
                                                if (isReadOnly || (isEditing && !row.is_new)) return;


                                                const ppLot = selectedProductPresentation?.lots || [];
                                                const locationLots = ppLot.filter((lot: Lot) => {
                                                    const stockInLocation = lot.stock?.some((stock: Stock) => {
                                                        if (fromLocationId) {
                                                            return stock.location_id === Number(fromLocationId);
                                                        }
                                                        return false;
                                                    });
                                                    return stockInLocation;
                                                });

                                                const {
                                                    lot_id,
                                                    stock_id,
                                                    max_quantity,
                                                    lot
                                                } = getLotData(locationLots, null, Number(fromLocationId));

                                                const { exists } = lotIdForProductPresentationForProductExists(
                                                    row?.product_id,
                                                    selectedProductPresentation?.product_presentation_id || null,
                                                    lot_id
                                                );

                                                const adaptedPresentation = {
                                                    ...selectedProductPresentation,
                                                    lots: locationLots,
                                                    product_presentation_id: selectedProductPresentation?.product_presentation_id ?? null,
                                                    product_presentation_name: selectedProductPresentation?.product_presentation_name ?? '',
                                                }

                                                if (isTransferring) return;
                                                const updatedItems = transferOrderItems.map((item) =>
                                                    item.transfer_order_item_id === row.transfer_order_item_id
                                                        ? {
                                                            ...item,
                                                            product_presentation: adaptedPresentation,
                                                            product_presentation_id: selectedProductPresentation?.product_presentation_id ?? 0,
                                                            lot_id: exists ? null : lot_id,
                                                            lot: exists ? null : lot,
                                                            quantity: 0,
                                                            stock_id: stock_id,
                                                            max_quantity: max_quantity,
                                                        }
                                                        : item
                                                );

                                                onChangeTransferOrderItems(updatedItems);

                                            }}
                                            disabled={isTransferring || isReadOnly || (isEditing && !row.is_new)}
                                            isFetchWithLots={true}
                                            isFetchedWithLotContainersLocation={true}
                                        >
                                            <SelectProductPresentation />
                                        </ProductPresentationSelectorRoot>

                                    </div>
                                </TableCell>

                                <TableCell className="align-top">
                                    <StockLocationTableCell
                                        disabled={!row.product_presentation}
                                        productName={row.product?.product_name || ''}
                                        lots={rowLots}
                                    />
                                </TableCell>

                                <TableCell className="align-top w-40 ">
                                    {isTransferring || isReadOnly ? (<>
                                        <span className="w-full h-full flex items-center pt-2">
                                            {row.quantity}
                                        </span>
                                    </>) : (


                                        <InputGroup>
                                            <InputGroupInput
                                                disabled={isTransferring || isReadOnly}
                                                value={row.quantity ?? ""}
                                                onChange={(e) => {
                                                    if (maxQtyInFromLocation !== null && Number(e.target.value) > maxQtyInFromLocation) {
                                                        toast.error(`La cantidad no puede ser mayor al stock disponible (${maxQtyInFromLocation}).`);
                                                        return;
                                                    }
                                                    const inputValue = e.target.value;
                                                    const quantity = inputValue === "" ? null : Number(inputValue);
                                                    const updatedItems = transferOrderItems.map((item) =>
                                                        item.transfer_order_item_id === row.transfer_order_item_id
                                                            ? {
                                                                ...item,
                                                                quantity: quantity || 0,

                                                            }
                                                            : item
                                                    );

                                                    onChangeTransferOrderItems(updatedItems);

                                                }
                                                }
                                                placeholder="--"
                                            />
                                            <InputGroupAddon align="inline-end">
                                                /{maxQtyInFromLocation}
                                            </InputGroupAddon>
                                        </InputGroup>
                                    )}

                                </TableCell>

                                {/* <TableCell className="align-top w-40 ">
                                {isTransferring ? (
                                    <>{row.lot_containers_stock?.quantity ?? ""}</>
                                ) : (
                                    <InputGroup>
                                        <InputGroupInput
                                            value={row.lot_containers_location?.quantity ?? ""}
                                            disabled={isTransferring}
                                            onChange={(e) => {
                                                console.log("🟢 maxLotContainerLocationQty onChange:", maxLotContainerLocationQty)
                                                console.log("🟢 e.target.value:", e.target.value)
                                                if (maxLotContainerLocationQty !== null && Number(e.target.value) > maxLotContainerLocationQty) {
                                                    toast.error(`La cantidad de vacios no puede ser mayor al disponible (${maxLotContainerLocationQty}).`);
                                                    return;
                                                }
                                                const inputValue = e.target.value;
                                                const quantity = inputValue === "" ? null : Number(inputValue);

                                                const lotContainersLocationId = selectedLotLotContainerLocation?.lot_containers_location_id || null;
                                                console.log("🟢 lotContainersLocationId:", lotContainersLocationId);
                                                const updatedItems = transferOrderItems.map((item) =>
                                                    item.transfer_order_item_id === row.transfer_order_item_id
                                                        ? {
                                                            ...item,
                                                            lot_container_id: selectedLotLotContainerLocation?.lot_container_id || null,
                                                            lot_containers_location_id: lotContainersLocationId,
                                                            lot_containers_location: {
                                                                ...item.lot_containers_location,
                                                                lot_container_id: selectedLotLotContainerLocation?.lot_container_id || null,
                                                                quantity: quantity,
                                                            },
                                                            lot_containers_movement: {
                                                                ...item.lot_containers_movement,
                                                                lot_container_id: selectedLotLotContainerLocation?.lot_container_id || null,
                                                                lot_containers_location_id: lotContainersLocationId,
                                                                quantity: quantity,
                                                                lot_container_status: "PENDING",
                                                            },

                                                        }
                                                        : item
                                                );
                                                onChangeOrder?.({
                                                    ...transferOrder,
                                                    transfer_order_items: updatedItems,
                                                });
                                            }
                                            }
                                            placeholder="--"
                                        />
                                        <InputGroupAddon align="inline-end">
                                            /{maxQtyInFromLocation}
                                        </InputGroupAddon>
                                    </InputGroup>

                                )}
                            </TableCell> */}

                                {
                                    (!isTransferring && !isReadOnly) && (
                                        <TableCell className="align-top w-36 ">
                                            {rowLots.length === 0 ? (
                                                <span className="text-sm text-muted-foreground h-10 flex items-center">No hay lotes</span>
                                            ) : (
                                                <Select
                                                    value={row?.lot_id ? String(row.lot_id) : "null"}
                                                    onValueChange={(value) => {
                                                        const lotId = value === "null" ? null : Number(value);

                                                        const ppLot = row.product_presentation?.lots || [];

                                                        const {
                                                            lot_id,
                                                            stock_id,
                                                            max_quantity,
                                                            lot
                                                        } = getLotData(ppLot, lotId, Number(fromLocationId));


                                                        const { exists } = lotIdForProductPresentationForProductExists(
                                                            row?.product_id,
                                                            row?.product_presentation_id || null,
                                                            lot_id
                                                        );

                                                        if (exists) {
                                                            toast.error(`El lote seleccionado ya ha sido agregado para esta presentación.`);
                                                            return;
                                                        }


                                                        const updatedItems = transferOrderItems.map((item) =>
                                                            item.transfer_order_item_id === row.transfer_order_item_id
                                                                ? {
                                                                    ...item,
                                                                    lot_id: lot_id,
                                                                    quantity: 0,
                                                                    stock_id: stock_id,
                                                                    lot: lot,
                                                                    max_quantity
                                                                }
                                                                : item
                                                        );

                                                        onChangeTransferOrderItems(updatedItems);


                                                        // onChangeOrder?.({
                                                        //     ...transferOrder,
                                                        //     transfer_order_items: updatedItems,
                                                        // });
                                                    }}


                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Seleccionar lote" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Lots</SelectLabel>
                                                            {rowLots.map((lot: Lot) => {
                                                                return <SelectItem
                                                                    key={lot.lot_id
                                                                        ? lot.lot_id
                                                                        : Math.random()}
                                                                    value={lot.lot_id ? String(lot.lot_id) : "null"}

                                                                >
                                                                    {formatDate(lot.created_at)}
                                                                </SelectItem>
                                                            })}

                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            )}

                                        </TableCell>
                                    )
                                }

                                {/* {
                                isTransferring && (

                                    <TableCell className="align-top w-36 " >
                                        <div className="w-full h-10 flex items-center justify-center ">

                                            <Checkbox
                                                checked={row.is_transferred}
                                                onCheckedChange={(checked) => {
                                                    const isTransferred = checked ? true : false;

                                                    const updatedItems = transferOrderItems.map((item) =>
                                                        item.transfer_order_item_id === row.transfer_order_item_id
                                                            ? {
                                                                ...item,
                                                                is_transferred: isTransferred,
                                                            }
                                                            : item
                                                    );
                                                    onChangeOrder?.({
                                                        ...transferOrder,
                                                        transfer_order_items: updatedItems,
                                                    });
                                                }}
                                                disabled={!isTransferring || row.status === 'COMPLETED'}
                                            />
                                        </div>
                                    </TableCell>
                                )
                            } */}

                                {
                                    (!isTransferring && !isReadOnly) && (
                                        <TableCell className="text-right align-top w-20 ">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                // disabled={!isTransferring}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    handleRemoveItem(row.transfer_order_item_id);
                                                }}
                                            >
                                                <Trash />
                                            </Button>
                                        </TableCell>
                                    )
                                }
                            </TableRow>)
                        })
                    }

                    {!isTransferring && (
                        <TableRow className="border-none">
                            <TableCell className="" >

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddElement}
                                >
                                    Agregar Elemento
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}

                    <div className="h-60">

                    </div>

                    {/* Summary of form-level errors when saving is attempted */}
                    {/* {!areRowsValid && (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <div role="alert" className="text-destructive text-sm">
                                    Corrige los errores antes de guardar: producto requerido, cantidad {'>'} 0 y sin duplicados.
                                </div>
                            </TableCell>
                        </TableRow>
                    )} */}




                </TableBody>
            </Table >
        </div >
    );
}
