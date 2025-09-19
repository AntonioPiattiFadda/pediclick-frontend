import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { createStockMovement } from "@/service/stockMovement";
import type { StockMovement } from "@/types/stockMovements";
import type { Stock } from "@/types/stocks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StoreSelector } from "../shared/StoresSelector";
import { StockRoomSelector } from "../shared/stockRoomSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StockMovementDTO = NonNullable<StockMovement>;
const buildMovementFromStock = (stock?: Stock): StockMovementDTO => ({
    lot_id: stock?.lot_id ?? 0,
    movement_type: "TRANSFER",
    quantity: null,
    from_stock_room_id: stock?.stock_type === "STOCKROOM" ? (stock?.stock_room_id ?? null) : null,
    to_stock_room_id: null,
    from_store_id: stock?.stock_type === "STORE" ? (stock?.store_id ?? null) : null,
    to_store_id: null,
    should_notify_owner: false,
});

export function StockMovement({
    stockData,
    loadOrderId,
}: {
    stockData?: Stock;
    loadOrderId: number;
}) {
    console.log("stockData en StockMovement:", stockData);
    console.log("loadOrderId:", loadOrderId);

    //      {
    //     lot_id: 99,
    //     stores: null,
    //     stock_id: 7,
    //     store_id: null,
    //     created_at: '2025-09-16T19:03:56.077446+00:00',
    //     stock_type: 'NOT ASSIGNED',
    //     updated_at: '2025-09-16T19:03:56.077446+00:00',
    //     stock_rooms: null,
    //     last_updated: null,
    //     stock_room_id: null,
    //     current_quantity: 15,
    //     max_notification: null,
    //     min_notification: null,
    //     transformed_to_product_id: null,
    //     transformed_from_product_id: null
    //   }

    const queryClient = useQueryClient();

    const [newStockMovement, setNewStockMovement] = useState<StockMovementDTO>(
        buildMovementFromStock(stockData)
    );
    const [open, setOpen] = useState(false);

    const [selectedToLocationType, setSelectedToLocationType] = useState<string>("");

    // Prefill "from" based on the current stock location of this lot
    useEffect(() => {
        setNewStockMovement(buildMovementFromStock(stockData));
    }, [stockData]);

    const createStockMovementMutation = useMutation({
        mutationFn: async (data: { newStockMovement: StockMovement }) => {
            return await createStockMovement(data.newStockMovement);
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ["load-order", loadOrderId],
                exact: true,
            });
            setOpen(false);
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast("Error al crear movimiento de stock", {
                description: errorMessage,
            });
        },
    });

    const handleCreateStockMovement = async () => {
        if (!newStockMovement) return;

        console.log("Creating stock movement with data:", newStockMovement);
        // {
        //     lot_id: 98,
        //     movement_type: 'TRANSFER',
        //     quantity: 4,
        //     from_stock_room_id: null,
        //     to_stock_room_id: null,
        //     from_store_id: null,
        //     to_store_id: 27,
        //     should_notify_owner: false
        //   }

        try {
            await createStockMovementMutation.mutateAsync({ newStockMovement });
            setNewStockMovement(buildMovementFromStock(stockData));
        } catch (error) {
            console.error("Error creating stock movement:", error);
        }
    };

    const isStockInStore = stockData?.stock_type === "STORE";
    // const storeName = isStockInStore ? "Tienda" : "Otro";
    const isStockInStockRoom = stockData?.stock_type === "STOCKROOM";
    const isStockUnassigned = stockData?.stock_type === "NOT ASSIGNED";

    const stockLocation = isStockInStore ? "Tienda" : isStockInStockRoom ? "Deposito" : isStockUnassigned ? "No Asignado" : "Otro";

    console.log("Rendering StockMovement with stockData:", stockLocation);

    return (
        <Sheet onOpenChange={setOpen} open={open}>
            <SheetTrigger asChild>
                <Button variant="outline">Mover Stock</Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col ">
                <SheetHeader>
                    <SheetTitle>Movimiento de Stock</SheetTitle>
                    <SheetDescription>
                        Realiza cambios en el movimiento de stock aquí. Haz clic en guardar cuando hayas terminado.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <div className="grid gap-3">
                        <Label htmlFor="sheet-demo-name">Stock Disponible desde:</Label>
                        <span>{stockLocation}</span>
                        <Input defaultValue={stockData?.current_quantity} disabled />
                    </div>
                    Mover hacia:

                    <Select onValueChange={(value) => {
                        if (value !== selectedToLocationType) {
                            setNewStockMovement((prev) => ({
                                ...prev,
                                to_store_id: null,
                                to_stock_room_id: null
                            }));
                        }
                        setSelectedToLocationType(value);
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STORE">Tienda</SelectItem>
                            <SelectItem value="STOCKROOM">Deposito</SelectItem>
                            <SelectItem value="NOT ASSIGNED">No Asignado</SelectItem>
                        </SelectContent>
                    </Select>

                    {selectedToLocationType === "STORE" && (<StoreSelector
                        value={newStockMovement.to_store_id}
                        onChange={(id) => {
                            setNewStockMovement((prev) => ({
                                ...prev,
                                to_store_id: id,
                                to_stock_room_id: null,
                            }));
                        }}
                        disabled={false}
                    />)}
                    {selectedToLocationType === "STOCKROOM" && (<StockRoomSelector
                        value={newStockMovement.to_stock_room_id}
                        onChange={(id) => {
                            setNewStockMovement((prev) => ({
                                ...prev,
                                to_stock_room_id: id,
                                to_store_id: null,
                            }));
                        }}
                        disabled={false}
                    />
                    )}

                    <Label htmlFor="sheet-demo-name">Cantidad a Mover:</Label>
                    <Input
                        type="number"
                        min={1}
                        max={stockData?.current_quantity ?? undefined}
                        value={newStockMovement?.quantity ?? ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNewStockMovement((prev) => ({
                                ...prev,
                                quantity: val === "" ? null : Number(val),
                            }));
                        }}
                    />
                    {(() => {
                        const qty = newStockMovement?.quantity ?? 0;
                        const max = stockData?.current_quantity ?? 0;
                        const qtyInvalid =
                            !Number.isFinite(qty) || qty <= 0 || qty > max;
                        const sameLocation =
                            selectedToLocationType !== "" &&
                            selectedToLocationType === stockData?.stock_type &&
                            (
                                (selectedToLocationType === "STORE" && newStockMovement?.to_store_id === stockData?.store_id) ||
                                (selectedToLocationType === "STOCKROOM" && newStockMovement?.to_stock_room_id === stockData?.stock_room_id) ||
                                (selectedToLocationType === "NOT ASSIGNED")
                            );
                        const destMissing =
                            (selectedToLocationType === "STORE" && !newStockMovement?.to_store_id) ||
                            (selectedToLocationType === "STOCKROOM" && !newStockMovement?.to_stock_room_id);

                        return (
                            <div className="flex flex-col gap-1 text-xs">
                                {qtyInvalid && (
                                    <span className="text-destructive">
                                        Cantidad inválida. Debe ser entre 1 y {max}.
                                    </span>
                                )}
                                {sameLocation && (
                                    <span className="text-destructive">
                                        El origen y destino no pueden ser iguales.
                                    </span>
                                )}
                                {destMissing && (
                                    <span className="text-destructive">
                                        Selecciona un destino válido.
                                    </span>
                                )}
                            </div>
                        );
                    })()}

                </div>
                <SheetFooter className="mt-auto">
                    <Button
                        onClick={handleCreateStockMovement}
                        disabled={
                            !Number.isFinite(newStockMovement?.quantity ?? NaN) ||
                            (newStockMovement?.quantity ?? 0) <= 0 ||
                            (stockData?.current_quantity !== undefined &&
                                (newStockMovement?.quantity ?? 0) > (stockData?.current_quantity ?? 0)) ||
                            (selectedToLocationType === "STORE" && !newStockMovement?.to_store_id) ||
                            (selectedToLocationType === "STOCKROOM" && !newStockMovement?.to_stock_room_id) ||
                            (
                                selectedToLocationType !== "" &&
                                selectedToLocationType === stockData?.stock_type &&
                                (
                                    (selectedToLocationType === "STORE" && newStockMovement?.to_store_id === stockData?.store_id) ||
                                    (selectedToLocationType === "STOCKROOM" && newStockMovement?.to_stock_room_id === stockData?.stock_room_id) ||
                                    (selectedToLocationType === "NOT ASSIGNED")
                                )
                            )
                        }
                    >
                        Registrar movimiento
                    </Button>
                    <SheetClose asChild>
                        <Button variant="outline">Close</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
