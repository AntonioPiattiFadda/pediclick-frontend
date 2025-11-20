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
import type { Lot } from "@/types/lots";
import type { Product } from "@/types/products";
import type { TransferOrderItem } from "@/types/transferOrderItems";
import type { TransferOrderStatus, TransferOrderType } from "@/types/transferOrders";
import { Trash } from "lucide-react";
import { emptyProduct } from "../shared/emptyFormData";
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../shared/selectors/productPresentationSelector";
import ProductSelector from "../shared/selectors/productSelector";
import { StockLocationTableCell } from "./StockLocationTableCell";
import { toast } from "sonner";
import { formatDate } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "react-router-dom";


// const getMaxQtyInFromLocation = (lots: Lot[], fromStoreId: number | null | undefined, fromStockRoomId: number | null | undefined): number => {
//     let total = 0;

//     console.log("Calculating max qty in from location:", { fromStoreId, fromStockRoomId });

//     if (fromStoreId) {
//         lots.forEach((lot) => {
//             lot.stock?.forEach((stock) => {
//                 if (stock.store_id === fromStoreId && stock.stock_type !== "NOT ASSIGNED") {
//                     total += stock.current_quantity;
//                 }
//             });
//         });
//     }

//     if (fromStockRoomId) {
//         lots.forEach((lot) => {
//             lot.stock?.forEach((stock) => {
//                 if (stock.stock_room_id === fromStockRoomId && stock.stock_type !== "NOT ASSIGNED") {
//                     total += stock.current_quantity;
//                 }
//             });
//         });
//     }

//     return total;
// }



export default function TransferOrderItemsTable({
    transferOrder,
    onChangeOrder,
    isUpdating,
    isTransferring
}: {
    transferOrder: TransferOrderType;
    onChangeOrder?: (updatedOrder: TransferOrderType) => void;
    isUpdating: boolean;
    isTransferring: boolean;
}) {


    // Mutations
    // const upsertMutation = useMutation({
    //     mutationFn: async () => {
    //         const payload = rows.map((r) => ({
    //             transfer_order_item_id: r.transfer_order_item_id,
    //             transfer_order_id: r.transfer_order_id,
    //             product_id: r.product_id,
    //             lot_id: r.lot_id,
    //             quantity: Number(r.quantity || 0),
    //             is_transferred: r.is_transferred ?? false,
    //         })) as Array<Partial<TransferOrderItem>>;

    //         return await upsertTransferOrderItems(payload);
    //     },
    //     onMutate: async () => {
    //         toast("Guardando ítems...", { description: "Aplicando cambios" });
    //     },
    //     onSuccess: () => {
    //         setDirty(false);
    //         queryClient.invalidateQueries({
    //             queryKey: ["transfer-order", transferOrder.transfer_order_id],
    //         });
    //         toast("Ítems guardados", {
    //             description: "Los cambios se guardaron correctamente",
    //         });
    //     },
    //     onError: (e: unknown) => {
    //         const msg = e instanceof Error ? e.message : "No se pudieron guardar los cambios";
    //         toast("Error al guardar", {
    //             description: msg,
    //         });
    //     },
    // });

    const handleAddElement = () => {
        if (!isTransferring) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItem: any = {
            transfer_order_item_id: Math.random(), // Temporary ID for React key
            transfer_order_id: transferOrder.transfer_order_id,
            product_id: undefined,
            lot_id: null,
            quantity: null,
            isNew: true,
            product: emptyProduct,
            lot_container_location: null,
        };
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: [...rows, newItem],
        });
    };

    const handleRemoveItem = (itemId: number | undefined) => {
        if (itemId === undefined) return;
        if (!isTransferring) return;
        const updatedItems = rows.filter((item) => item.transfer_order_item_id !== itemId);
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: updatedItems,
        });
    };

    const handleSelectProduct = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row: any,
        product: Product,
    ) => {
        if (!isTransferring) return;
        const updatedItems = rows.map((item) =>
            item.transfer_order_item_id === row.transfer_order_item_id
                ? {
                    ...item, product_id: product.product_id ?? null, product,
                    product_presentation: null,
                    lot_id: null,
                }
                : item
        );
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: updatedItems,
        });
    };

    const rows: TransferOrderItem[] = transferOrder.transfer_order_items || [];

    console.log("TransferOrderItemsTable render", rows);

    //TODO Ubicaciones del lote
    // TODO Asignacion de la cantidad 
    // TODO Validaciones de los campos

    const locationId = transferOrder.from_store_id || transferOrder.from_stock_room_id || null;
    const locationType = transferOrder.from_store_id ? 'STORE' : transferOrder.from_stock_room_id ? 'STOCK_ROOM' : null;

    console.log("TransferOrderItemsTable location", { locationId, locationType });

    return (
        <div className="rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Producto</TableHead>
                        <TableHead className="w-[120px]">Stock disponible</TableHead>
                        <TableHead className="w-40">Cantidad</TableHead>
                        <TableHead className="w-40">Vacíos</TableHead>
                        {!isTransferring && (
                            <TableHead className="w-40">Lote</TableHead>
                        )}
                        <TableHead className="w-40">Transferido</TableHead>
                        {!isTransferring && (
                            <TableHead className="text-right w-10">Acciones</TableHead>
                        )}

                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center align-middle">No hay ítems en la orden de transferencia.</TableCell>
                        </TableRow>
                    )}
                    {rows.map((row) => {
                        const rowLots = row.product_presentation?.lots || [];
                        const selectedLocationLot = rowLots.find((lot) => lot.lot_id === row.lot_id);

                        // Mutations
                        const selectedLotLotContainerLocation = selectedLocationLot?.lot_containers_location
                        const maxLotContainerLocationQty = selectedLotLotContainerLocation?.[0]?.quantity || 0;



                        const filteredStocks = selectedLocationLot?.stock?.filter((stock) => {
                            if (locationType === 'STORE' && transferOrder.from_store_id) {
                                return stock.store_id === transferOrder.from_store_id;
                            } else if (locationType === 'STOCK_ROOM' && transferOrder.from_stock_room_id) {
                                return stock.stock_room_id === transferOrder.from_stock_room_id;
                            }
                            return false;
                        }) || [];


                        const maxQtyInFromLocation = filteredStocks.reduce((acc, stock) => {
                            // Here you would check if the stock's location matches the transfer order's from location
                            // For simplicity, we sum all stock quantities
                            return acc + (stock.current_quantity || 0);
                        }, 0) || 0;
                        //Filtrar por localizacion

                        return (<TableRow key={row.transfer_order_item_id}>
                            <TableCell className="align-top w-[50%]">
                                <div className="relative flex gap-1">

                                    <ProductSelector
                                        value={row.product || emptyProduct}
                                        onChange={(p) => handleSelectProduct(row, p)}
                                        disabled={isTransferring}
                                    />
                                    <ProductPresentationSelectorRoot
                                        productId={row?.product_id}
                                        value={row?.product_presentation || null}
                                        onChange={(selectedProductPresentation) => {
                                            if (!allowEdit) return;
                                            const updatedItems = rows.map((item) =>
                                                item.transfer_order_item_id === row.transfer_order_item_id
                                                    ? {
                                                        ...item,
                                                        product_presentation: selectedProductPresentation,

                                                    }
                                                    : item
                                            );
                                            onChangeOrder?.({
                                                ...transferOrder,
                                                transfer_order_items: updatedItems,

                                            });
                                        }}
                                        disabled={isTransferring}
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
                                <InputGroup>
                                    <InputGroupInput
                                        value={row.quantity ?? ""}
                                        onChange={(e) => {
                                            if (!allowEdit) return;
                                            if (maxQtyInFromLocation !== null && Number(e.target.value) > maxQtyInFromLocation) {
                                                toast.error(`La cantidad no puede ser mayor al stock disponible (${maxQtyInFromLocation}).`);
                                                return;
                                            }
                                            const inputValue = e.target.value;
                                            const quantity = inputValue === "" ? null : Number(inputValue);
                                            const updatedItems = rows.map((item) =>
                                                item.transfer_order_item_id === row.transfer_order_item_id
                                                    ? {
                                                        ...item,
                                                        quantity: quantity,

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


                            </TableCell>


                            <TableCell className="align-top w-40 ">
                                <InputGroup>
                                    <InputGroupInput
                                        value={row.lot_container_movements?.quantity ?? ""}
                                        onChange={(e) => {
                                            if (!isTransferring) return;
                                            if (maxLotContainerLocationQty !== null && Number(e.target.value) > maxLotContainerLocationQty) {
                                                toast.error(`La cantidad de vacios no puede ser mayor al disponible (${maxLotContainerLocationQty}).`);
                                                return;
                                            }
                                            const inputValue = e.target.value;
                                            const quantity = inputValue === "" ? null : Number(inputValue);
                                            const updatedItems = rows.map((item) =>
                                                item.transfer_order_item_id === row.transfer_order_item_id
                                                    ? {
                                                        ...item,
                                                        lot_container_movements: {
                                                            ...item.lot_container_movements,
                                                            quantity: quantity,
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


                            </TableCell>
                            {!isTransferring && (
                                <TableCell className="align-top w-36 ">

                                    <Select
                                        value={row?.lot_id ? String(row.lot_id) : "null"}
                                        onValueChange={(value) => {
                                            if (!isTransferring) return;

                                            const lotId = value === "null" ? null : Number(value);

                                            const updatedItems = rows.map((item) =>
                                                item.transfer_order_item_id === row.transfer_order_item_id
                                                    ? {
                                                        ...item,
                                                        lot_id: lotId,
                                                        selected_lot: item.product_presentation?.lots.find(l => l.lot_id === lotId) ?? null
                                                    }
                                                    : item
                                            );

                                            onChangeOrder?.({
                                                ...transferOrder,
                                                transfer_order_items: updatedItems,
                                            });
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


                                </TableCell>
                            )}
                            <TableCell className="align-top w-36 " >
                                <div className="w-full h-10 flex items-center justify-center ">

                                    <Checkbox
                                        checked={row.is_transferred}
                                        onCheckedChange={(checked) => {
                                            if (!allowEdit) return;
                                            const isTransferred = checked ? true : false;

                                            const updatedItems = rows.map((item) =>
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
                                        disabled={!isTransferring}
                                    />
                                </div>
                            </TableCell>

                            {!isTransferring && (
                                <TableCell className="text-right align-top w-20 ">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={!isTransferring}
                                        onClick={() => handleRemoveItem(row.transfer_order_item_id)}
                                    >
                                        <Trash />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>)
                    })
                    }

                    {!isTransferring && (
                        <TableRow className="border-none">
                            <TableCell className="" >

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isTransferring}
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
