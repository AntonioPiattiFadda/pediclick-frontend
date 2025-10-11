import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLotStocks } from "@/service/stock";
import { createStockMovement } from "@/service/stockMovement";
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import type { StockMovement as StockMovementType } from "@/types/stockMovements";
import type { Stock } from "@/types/stocks";
import { formatStockLocation } from "@/utils/stock";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { CreateStockRoom, SelectStockRoom, StockroomSelectorRoot } from "../shared/stockRoomSelector";
import { CreateStore, SelectStore, StoreSelectorRoot } from "../shared/storesSelector";

type StockWithRelations = Stock & {
    stores?: { store_name?: string } | null;
    stock_rooms?: { stock_room_name?: string } | null;
};

type DestinationType = "" | "STORE" | "STOCKROOM" | "NOT ASSIGNED";



type MovementDTO = NonNullable<StockMovementType>;

function buildPayload(params: {
    lotId: number;
    from?: StockWithRelations;
    destType: DestinationType;
    toStoreId: number | null;
    toStockRoomId: number | null;
    quantity: number | null;
}): MovementDTO {
    const { lotId, from, destType, toStoreId, toStockRoomId, quantity } = params;
    return {
        lot_id: lotId,
        movement_type: "TRANSFER",
        quantity: quantity ?? null,
        from_stock_room_id: from?.stock_type === "STOCKROOM" ? from?.stock_room_id ?? null : null,
        to_stock_room_id: destType === "STOCKROOM" ? toStockRoomId ?? null : null,
        from_store_id: from?.stock_type === "STORE" ? from?.store_id ?? null : null,
        to_store_id: destType === "STORE" ? toStoreId ?? null : null,
        should_notify_owner: false,
    };
}

function useCreateStockMovement(queryKey: (number | string)[], aditionalQueryKey?: (number | string)[], onAfterSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { newStockMovement: StockMovementType }) => {
            return await createStockMovement(data.newStockMovement);
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: queryKey,
                exact: true,
            });
            await queryClient.refetchQueries({
                queryKey: aditionalQueryKey,
                exact: true,
            });
            toast.success("Has movido el stock exitosamente");
            onAfterSuccess?.();
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast(errorMessage || "Error al crear movimiento de stock");
        },
    });
}


export function StockMovement({
    lotId,
    aditionalQueryKey = [],
}: {
    lotId: number;
    aditionalQueryKey?: (number | string)[];
}) {
    const queryKey = ["stock", lotId];
    const { data: lotStock = [], isLoading, isError } = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const response = await getLotStocks(lotId);
            return response.lotStock;
        },
        enabled: !!lotId,
    });

    console.log("lotStock", lotStock);

    const totalQty = lotStock?.reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0);

    // FIXME Aca solo necesito el lot_id no el resto del objeto lot
    const [open, setOpen] = useState(false);

    const [selectedFromId, setSelectedFromId] = useState<number | null>(null);
    const [selectedLotContainersLocation, setSelectedLotContainersLocation] = useState<LotContainersLocation | null>(null);
    const [lotContainersToMove, setLotContainersToMove] = useState<{ quantity: number; auto: boolean }>({
        quantity: 0,
        auto: true
    });

    console.log("selectedLotContainersLocation", selectedLotContainersLocation);

    const selectedFrom = useMemo(
        () => lotStock?.find((s) => s.stock_id === selectedFromId),
        [lotStock, selectedFromId]
    );

    const [destType, setDestType] = useState<DestinationType>("");
    const [toStoreId, setToStoreId] = useState<number | null>(null);
    const [toStockRoomId, setToStockRoomId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number | "">("");

    // Reset destination ids on type change
    useEffect(() => {
        setToStoreId(null);
        setToStockRoomId(null);
    }, [destType]);

    // Reset all state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedFromId(null);
            setSelectedLotContainersLocation(null);
            setDestType("");
            setToStoreId(null);
            setToStockRoomId(null);
            setQuantity("");
        }
    }, [open]);
    const resetForm = () => {
        setSelectedFromId(null);
        setSelectedLotContainersLocation(null);
        setDestType("");
        setToStoreId(null);
        setToStockRoomId(null);
        setQuantity("");
    };

    const createMovement = useCreateStockMovement(queryKey, aditionalQueryKey, () => {
        // Keep dialog open, reset form, and values will refresh via query refetch

        resetForm();
    });

    if (isLoading) {
        return <Button variant="outline" disabled>Cargando stock...</Button>;
    }
    if (isError) {
        return <Button variant="outline" disabled>Sin stock</Button>;
    }



    const qtyNum = typeof quantity === "number" ? quantity : NaN;
    const fromQty = selectedFrom?.current_quantity ?? 0;
    const qtyInvalid = !Number.isFinite(qtyNum) || qtyNum <= 0 || qtyNum > fromQty;
    const destMissing =
        (destType === "STORE" && !toStoreId) ||
        (destType === "STOCKROOM" && !toStockRoomId) ||
        destType === "";
    const fromMissing = !selectedFrom;
    const sameLocation =
        !!selectedFrom &&
        destType !== "" &&
        destType === selectedFrom.stock_type &&
        ((destType === "STORE" && toStoreId === selectedFrom.store_id) ||
            (destType === "STOCKROOM" && toStockRoomId === selectedFrom.stock_room_id) ||
            (destType === "NOT ASSIGNED" && selectedFrom.stock_type === "NOT ASSIGNED"));

    const handleSubmit = async () => {
        if (!selectedFrom) return;
        const payload = buildPayload({
            lotId,
            from: selectedFrom,
            destType,
            toStoreId,
            toStockRoomId,
            quantity: Number(quantity),
        });
        await createMovement.mutateAsync({ newStockMovement: payload });
    };

    // const totalQty = (stocks ?? []).reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Mover stock</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Movimiento de Stock</DialogTitle>
                    <DialogDescription>
                        Visualiza la distribución actual del stock y mueve cantidades entre ubicaciones.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto">
                    <div>
                        <div className="text-sm mb-2 font-medium">Distribución actual (Total: {totalQty})</div>
                        <div className="rounded border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(lotStock ?? []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground">
                                                Sin stock asociado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (lotStock ?? [])
                                            .sort((a, b) => a.stock_id - b.stock_id)
                                            .map((item) => {
                                                const { typeLabel, nameLabel } = formatStockLocation(item);
                                                return (
                                                    <TableRow key={item.stock_id}>
                                                        <TableCell className="max-w-[220px]">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name="fromLocation"
                                                                    checked={selectedFromId === item.stock_id}
                                                                    onChange={() => {
                                                                        setSelectedFromId(item.stock_id ?? null)
                                                                        setSelectedLotContainersLocation(item.lot_containers_location ?? null);
                                                                    }
                                                                    }
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{nameLabel || typeLabel}</span>
                                                                    {nameLabel && (
                                                                        <span className="text-xs text-muted-foreground">{typeLabel}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{typeLabel}</TableCell>
                                                        <TableCell>{item.current_quantity}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label>Origen</Label>
                            <Select
                                value={selectedFromId ? String(selectedFromId) : ""}
                                onValueChange={(v: string) => {
                                    setSelectedFromId(Number(v))
                                    const selectedStock = lotStock?.find((s) => s.stock_id === Number(v));
                                    if (selectedStock) {
                                        setSelectedLotContainersLocation(selectedStock.lot_containers_location ?? null);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar origen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(lotStock ?? []).map((item) => {
                                        const { typeLabel, nameLabel } = formatStockLocation(item);
                                        return (
                                            <SelectItem key={item.stock_id} value={String(item.stock_id)}>
                                                {typeLabel} {nameLabel ? `• ${nameLabel}` : ""} — Disp: {item.current_quantity}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Destino</Label>
                            <Select value={destType} onValueChange={(v: string) => setDestType(v as DestinationType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STORE">Tienda</SelectItem>
                                    <SelectItem value="STOCKROOM">Depósito</SelectItem>
                                    <SelectItem value="NOT ASSIGNED">No asignado</SelectItem>
                                </SelectContent>
                            </Select>

                            {destType === "STORE" && (
                                <StoreSelectorRoot value={toStoreId} onChange={setToStoreId} disabled={false}>
                                    <SelectStore />
                                    <CreateStore />
                                </StoreSelectorRoot>

                            )}
                            {destType === "STOCKROOM" && (
                                <StockroomSelectorRoot value={toStockRoomId} onChange={setToStockRoomId} disabled={false}>
                                    <SelectStockRoom />
                                    <CreateStockRoom />
                                </StockroomSelectorRoot>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 ">

                            <div className="grid gap-2">
                                <Label>Cantidad a mover</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={selectedFrom?.current_quantity ?? undefined}
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setQuantity(val === "" ? "" : Number(val));
                                    }}
                                />
                                <div className="flex flex-col gap-1 text-xs">
                                    {fromMissing && <span className="text-destructive">Selecciona un origen.</span>}
                                    {qtyInvalid && (
                                        <span className="text-destructive">
                                            Cantidad inválida. Debe ser entre 1 y {fromQty}.
                                        </span>
                                    )}
                                    {sameLocation && <span className="text-destructive">El origen y destino no pueden ser iguales.</span>}
                                    {destMissing && <span className="text-destructive">Selecciona un destino válido.</span>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex gap-2 items-center">

                                    <Label>Vacios a mover: {selectedLotContainersLocation?.quantity ?? 0}</Label>

                                    <Checkbox checked={lotContainersToMove.auto} onCheckedChange={() => {
                                        if (lotContainersToMove.auto) {
                                            console.log("auto to false", quantity)
                                            setLotContainersToMove({
                                                ...lotContainersToMove,
                                                quantity: quantity as number || 0,
                                            })
                                        }
                                        setLotContainersToMove({
                                            ...lotContainersToMove,
                                            auto: !lotContainersToMove.auto,
                                        })
                                    }} disabled={!(selectedLotContainersLocation?.quantity ?? 0 > 0)} />
                                    <Label>Mover con vacios {lotContainersToMove.quantity} </Label>

                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    max={selectedLotContainersLocation?.quantity ?? undefined}
                                    value={lotContainersToMove.quantity}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLotContainersToMove({
                                            ...lotContainersToMove,
                                            quantity: val === "" ? "" : Number(val)
                                        });
                                    }}
                                />
                                <div className="flex flex-col gap-1 text-xs">
                                    {/* {fromMissing && <span className="text-destructive">Selecciona un origen.</span>} */}
                                    {qtyInvalid && (
                                        <span className="text-destructive">.
                                        </span>
                                    )}
                                    {sameLocation && <span className="text-destructive">.</span>}
                                    {destMissing && <span className="text-destructive">.</span>}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={fromMissing || qtyInvalid || destMissing || sameLocation || createMovement.isLoading}
                    >
                        {createMovement.isLoading ? "Registrando..." : "Registrar movimiento"}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
