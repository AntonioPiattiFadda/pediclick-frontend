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
import type { TransferOrderType } from "@/types/transferOrders";
import { Trash } from "lucide-react";
import { emptyProduct } from "../shared/emptyFormData";
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../shared/selectors/productPresentationSelector";
import ProductSelector from "../shared/selectors/productSelector";
import { StockLocationTableCell } from "./StockLocationTableCell";
import { toast } from "sonner";
import { formatDate } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { Stock } from "@/types/stocks";
import type { MovementStatus } from "@/types/lotContainerMovements";


export default function TransferOrderItemsTable({
    transferOrder,
    onChangeOrder,
    isTransferring
}: {
    transferOrder: TransferOrderType;
    onChangeOrder?: (updatedOrder: TransferOrderType) => void;
    isTransferring: boolean;
}) {
    const handleAddElement = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItem: any = {
            transfer_order_item_id: Math.random(), // Temporary ID for React key
            transfer_order_id: transferOrder.transfer_order_id,
            product_id: undefined,
            lot_id: null,
            quantity: null,
            is_new: true,
            is_transferred: false,
            status: 'PENDING' as MovementStatus,
            stock_id: null,

            lot_containers_movement: [
                {
                    quantity: 0,
                    lot_container_status: "PENDING",
                },
            ],
            product: emptyProduct,
            lot_containers_location: {
                lot_container_location_id: null,
                lot_container_id: null,
                quantity: null,
            },

        };
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: [...rows, newItem],
        });
    };

    const handleRemoveItem = (itemId: number | undefined) => {
        if (itemId === undefined) return;
        if (isTransferring) return;
        const isItemNew = rows.find((item) => item.transfer_order_item_id === itemId)?.is_new;
        if (!isItemNew) {
            const updatedItems = rows.filter((item) => item.transfer_order_item_id !== itemId);
            onChangeOrder?.({
                ...transferOrder,
                transfer_order_items: updatedItems,
            });
        } else {

            onChangeOrder?.({
                ...transferOrder,
                transfer_order_items: updatedItems,
            });
        }
    };

    const handleSelectProduct = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row: any,
        product: Pick<Product, "product_id" | "product_name" | "short_code">,
    ) => {
        if (isTransferring) return;
        const updatedItems = rows.map((item) =>
            item.transfer_order_item_id === row.transfer_order_item_id
                ? {
                    ...item,
                    product_id: product.product_id ?? null,
                    product,
                    product_presentation: null,
                    lot_id: null,
                    quantity: null,
                    stock_id: null,
                    lot_containers_location: {
                        lot_container_location_id: null,
                        lot_container_id: null,
                        quantity: null,
                    },
                    lot_containers_movement: [
                        {
                            quantity: 0,
                            lot_container_status: "PENDING",
                        },
                    ],

                }
                : item
        );
        onChangeOrder?.({
            ...transferOrder,
            transfer_order_items: updatedItems,
        });
    };

    const rows: TransferOrderItem[] = transferOrder.transfer_order_items || [];


    //TODO Ubicaciones del lote
    // TODO Asignacion de la cantidad 
    // TODO Validaciones de los campos


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
                        {isTransferring && (
                            <TableHead className="w-40">Transferido</TableHead>
                        )}
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
                        const selectedLocationLot = rowLots.find((lot: Lot) => lot.lot_id === row.lot_id);

                        const filteredStocks = selectedLocationLot?.stock?.filter((stock: Stock) => {
                            return stock.location_id === transferOrder.from_location_id;
                        }) || [];

                        // Mutations
                        // const selectedLotLotContainerLocation = filteredStocks[0]?.lot_containers_location
                        const selectedLotLotContainerLocation = {
                            lot_containers_location_id: filteredStocks[0]?.lot_containers_location?.lot_containers_location_id || null,
                            lot_container_id: filteredStocks[0]?.lot_containers_location?.lot_container_id || null,
                            quantity: filteredStocks[0]?.lot_containers_location?.quantity || null,
                        }

                        console.log("🟢 selectedLotLotContainerLocation:", selectedLotLotContainerLocation);

                        const maxLotContainerLocationQty = selectedLotLotContainerLocation?.quantity || 0;
                        console.log("🟢 maxLotContainerLocationQty:", maxLotContainerLocationQty);


                        console.log("🟢 filteredStocks:", filteredStocks);


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
                                        onChange={(p) => handleSelectProduct(row, {
                                            product_name: p.product_name,
                                            product_id: p.product_id,
                                            short_code: p.short_code
                                        })}
                                        disabled={isTransferring}
                                    />
                                    <ProductPresentationSelectorRoot
                                        productId={row?.product_id}
                                        value={row?.product_presentation || null}
                                        onChange={(selectedProductPresentation) => {
                                            const ppLot = selectedProductPresentation?.lots || [];
                                            const firstLot = ppLot.length > 0 ? ppLot[0] : null;

                                            const filteredStocks = firstLot?.stock?.filter((stock) => {
                                                return stock.location_id === transferOrder.from_location_id;

                                            }) || [];

                                            console.log("🟢 filteredStocks on PP change:", filteredStocks);

                                            const stockId = filteredStocks.length > 0 ? filteredStocks[0].stock_id || null : null;
                                            console.log("🟢 stockId on PP change:", stockId);

                                            if (isTransferring) return;
                                            const updatedItems = rows.map((item) =>
                                                item.transfer_order_item_id === row.transfer_order_item_id
                                                    ? {
                                                        ...item,
                                                        product_presentation: selectedProductPresentation,
                                                        product_presentation_id: selectedProductPresentation?.product_presentation_id || null,
                                                        lot_id: firstLot ? firstLot.lot_id : null,
                                                        lot: firstLot,
                                                        quantity: null,
                                                        stock_id: stockId,


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
                                {isTransferring ? (<>
                                    <span className="w-full h-full flex items-center pt-2">
                                        {row.quantity}
                                    </span>
                                </>) : (


                                    <InputGroup>
                                        <InputGroupInput
                                            disabled={isTransferring}
                                            value={row.quantity ?? ""}
                                            onChange={(e) => {
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
                                )}

                            </TableCell>

                            <TableCell className="align-top w-40 ">
                                {isTransferring ? (
                                    <>{row.lot_containers_location?.quantity ?? ""}</>
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
                                                const updatedItems = rows.map((item) =>
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
                            </TableCell>

                            {
                                !isTransferring && (
                                    <TableCell className="align-top w-36 ">

                                        <Select
                                            value={row?.lot_id ? String(row.lot_id) : "null"}
                                            onValueChange={(value) => {
                                                const lotId = value === "null" ? null : Number(value);

                                                const ppLot = row.product_presentation?.lots || [];
                                                const firstLot = ppLot.find(l => l.lot_id === lotId) || null;

                                                const filteredStocks = firstLot?.stock?.filter((stock: Stock) => {
                                                    if (locationType === 'STORE' && transferOrder.from_store_id) {
                                                        return stock.store_id === transferOrder.from_store_id;
                                                    } else if (locationType === 'STOCK_ROOM' && transferOrder.from_stock_room_id) {
                                                        return stock.stock_room_id === transferOrder.from_stock_room_id;
                                                    }
                                                    return false;
                                                }) || [];

                                                console.log("🟢 filteredStocks on PP change:", filteredStocks);

                                                const stockId = filteredStocks.length > 0 ? filteredStocks[0].stock_id || null : null;
                                                console.log("🟢 stockId on PP change:", stockId);

                                                const updatedItems = rows.map((item) =>
                                                    item.transfer_order_item_id === row.transfer_order_item_id
                                                        ? {
                                                            ...item,
                                                            lot_id: lotId,
                                                            quantity: null,
                                                            stock_id: stockId,
                                                            lot: item.product_presentation?.lots.find(l => l.lot_id === lotId) ?? null
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
                                )
                            }

                            {
                                isTransferring && (

                                    <TableCell className="align-top w-36 " >
                                        <div className="w-full h-10 flex items-center justify-center ">

                                            <Checkbox
                                                checked={row.is_transferred}
                                                onCheckedChange={(checked) => {
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
                                                disabled={!isTransferring || row.status === 'COMPLETED'}
                                            />
                                        </div>
                                    </TableCell>
                                )
                            }

                            {
                                !isTransferring && (
                                    <TableCell className="text-right align-top w-20 ">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            // disabled={!isTransferring}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                alert("Eliminar ítem de la orden de transferencia");
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
