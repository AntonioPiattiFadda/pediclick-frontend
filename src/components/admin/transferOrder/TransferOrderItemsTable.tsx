import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TransferOrderStatus, TransferOrderType } from "@/types/transferOrders";
import { emptyProduct } from "../shared/emptyFormData";


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

function isEditable(status: TransferOrderStatus) {
    // Mirror LoadOrders restrictions: only allow editing while draft-like.
    // Here we treat PENDING as editable.
    return status === "PENDING";
}

export default function TransferOrderItemsTable({
    transferOrder,
    onChangeOrder,
}: {
    transferOrder: TransferOrderType;
    onChangeOrder?: (updatedOrder: TransferOrderType) => void;
}) {
    const allowEdit = isEditable(transferOrder.transfer_order_status);

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
        if (!allowEdit) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItem: any = {
            transfer_order_item_id: Math.random(), // Temporary ID for React key
            transfer_order_id: transferOrder.transfer_order_id,
            product_id: undefined,
            lot_id: null,
            quantity: null,
            isNew: true,
            product: emptyProduct
        };
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: [...rows, newItem],
        });
    };

    // const handleRemoveItem = (itemId: number | undefined) => {
    //     if (itemId === undefined) return;
    //     if (!allowEdit) return;
    //     const updatedItems = rows.filter((item) => item.transfer_order_item_id !== itemId);
    //     onChangeOrder?.({
    //         ...transferOrder,
    //         transfer_order_items: updatedItems,
    //     });
    // };

    // const handleSelectProduct = (
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     row: any,
    //     product: Product,
    // ) => {
    //     if (!allowEdit) return;
    //     const updatedItems = rows.map((item) =>
    //         item.transfer_order_item_id === row.transfer_order_item_id
    //             ? { ...item, product_id: product.product_id ?? null, product }
    //             : item
    //     );
    //     onChangeOrder?.({
    //         ...transferOrder,
    //         transfer_order_items: updatedItems,
    //     });
    // };

    const rows = transferOrder.transfer_order_items || [];

    console.log("TransferOrderItemsTable render", rows);

    //TODO Ubicaciones del lote
    // TODO Asignacion de la cantidad 
    // TODO Validaciones de los campos

    return (
        <div className="rounded-md">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                    {/* {allowEdit
                        ? "Edición habilitada"
                        : "Edición deshabilitada por estado"} */}

                    {/* <LocationsSelector
                        fromStoreId={transferOrder.from_store_id}
                        toStoreId={transferOrder.to_store_id}
                        fromStockRoomId={transferOrder.from_stock_room_id}
                        toStockRoomId={transferOrder.to_stock_room_id}
                        onChangeFromLocationId={(newLocations: {
                            from_store_id?: number | null;
                            from_stock_room_id?: number | null;
                            to_store_id?: number | null;
                            to_stock_room_id?: number | null;
                        }) => {

                            console.log("Desde:", newLocations);
                            onChangeOrder?.({
                                ...transferOrder,
                                ...newLocations,
                            });
                        }}
                        onChangeToLocationId={(newLocations: {
                            from_store_id?: number | null;
                            from_stock_room_id?: number | null;
                            to_store_id?: number | null;
                            to_stock_room_id?: number | null;
                        }) => {
                            onChangeOrder?.({
                                ...transferOrder,
                                ...newLocations,
                            });
                        }}
                    /> */}

                </div>
                {/* <div className="flex gap-2">
                    <Button
                        variant="outline"
                        // onClick={() => addEmptyRow()}
                        disabled={!allowEdit}
                    >
                        Agregar fila
                    </Button>
                </div> */}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[320px]">Producto</TableHead>
                        <TableHead className="w-[120px]">Stock disponible</TableHead>
                        <TableHead className="w-[120px]">Cantidad</TableHead>
                        <TableHead className="w-[140px]">Lote</TableHead>
                        <TableHead className="w-[140px]">Estado ítem</TableHead>
                        <TableHead className="text-right w-[140px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* {rows.map((row) => {
                        const rowLots = row.product?.lots || [];
                        const maxQtyInFromLocation = getMaxQtyInFromLocation(rowLots, transferOrder.from_store_id, transferOrder.from_stock_room_id); // TODO calcular según ubicación origen
                        const isQtyNull = row.quantity === null;
                        return (<TableRow key={row.transfer_order_item_id}>
                            <TableCell className="align-top ">
                                <div className="relative">
                                    <ProductSelector
                                        value={row.product || emptyProduct}
                                        onChange={(p) => handleSelectProduct(row, p)}
                                        withLots={true}

                                    />
                                 
                                </div>
                            </TableCell>

                            <TableCell className="align-top">
                                <StockLocationTableCell productName={row.product?.product_name || ''} lots={rowLots} maxQtyInFromLocation={maxQtyInFromLocation} />
                            </TableCell>

                         

                            <TableCell className="align-top">
                                <Input
                                    type="number"
                                    placeholder="--"
                                    min={0}
                                    max={maxQtyInFromLocation}
                                    disabled={!allowEdit}
                                    value={isQtyNull ? '' : row.quantity || ''}
                                    onChange={(e) => {
                                        const newQty = e.target.value ? Number(e.target.value) : 0;
                                        if (!allowEdit) return;
                                        if (newQty > maxQtyInFromLocation) {
                                            toast(`La cantidad no puede ser mayor a ${maxQtyInFromLocation}`);
                                            return
                                        }; // Extra validation
                                        const updatedItems = rows.map((item) =>
                                            item.transfer_order_item_id === row.transfer_order_item_id
                                                ? { ...item, quantity: newQty }
                                                : item
                                        );
                                        onChangeOrder?.({
                                            ...transferOrder,
                                            transfer_order_items: updatedItems,
                                        });

                                    }}

                                />
                             
                            </TableCell>

                            <TableCell className="align-top">

                                <Select disabled={!allowEdit} value={row.lot_id ? String(row.lot_id) : "null"} onValueChange={(value) => {
                                    if (!allowEdit) return;
                                    const updatedItems = rows.map((item) =>
                                        item.transfer_order_item_id === row.transfer_order_item_id
                                            ? {
                                                ...item,
                                                lot_id: value === "null" ? null : Number(value),
                                            }
                                            : item
                                    );
                                    onChangeOrder?.({
                                        ...transferOrder,
                                        transfer_order_items: updatedItems,
                                    });
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Seleccionar lote" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Lots</SelectLabel>
                                            {rowLots.map((lot: Lot) => (
                                                <SelectItem
                                                    key={lot.lot_id
                                                        ? lot.lot_id
                                                        : Math.random()}
                                                    value={lot.lot_id ? String(lot.lot_id) : "null"}

                                                >
                                                    {lot.created_at}
                                                </SelectItem>
                                            ))}

                                        </SelectGroup>
                                    </SelectContent>
                                </Select>


                            </TableCell>

                              <TableCell className="align-top" >
                                <span className="text-sm">
                                    {row.is_transferred ? "Transferido" : "Pendiente"}
                                </span>
                            </TableCell>

                       
                            <TableCell className="text-right align-top">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!allowEdit}
                                    onClick={() => handleRemoveItem(row.transfer_order_item_id)}
                                >
                                    Eliminar
                                </Button>

                            </TableCell>
                        </TableRow>)
                    })} */}

                    <TableRow>
                        <TableCell className="" >

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!allowEdit}
                                onClick={handleAddElement}
                            >
                                Agregar Elemento
                            </Button>
                        </TableCell>
                    </TableRow>

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
