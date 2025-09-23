import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createStockMovement } from "@/service/stockMovement";
import type { StockMovement as StockMovementType } from "@/types/stockMovements";
import type { Stock } from "@/types/stocks";
import type { Lot } from "@/types/lots";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StoreSelector } from "../shared/StoresSelector";
import { StockRoomSelector } from "../shared/stockRoomSelector";
import { formatStockLocation } from "@/pages/admin/LoadOrder";

type StockWithRelations = Stock & {
    stores?: { store_name?: string } | null;
    stock_rooms?: { stock_room_name?: string } | null;
};

type DestinationType = "" | "STORE" | "STOCKROOM" | "NOT ASSIGNED";



type MovementDTO = NonNullable<StockMovementType>;

function buildPayload(params: {
    lot: Lot;
    from?: StockWithRelations;
    destType: DestinationType;
    toStoreId: number | null;
    toStockRoomId: number | null;
    quantity: number | null;
}): MovementDTO {
    const { lot, from, destType, toStoreId, toStockRoomId, quantity } = params;
    return {
        lot_id: lot?.lot_id ?? 0,
        movement_type: "TRANSFER",
        quantity: quantity ?? null,
        from_stock_room_id: from?.stock_type === "STOCKROOM" ? from?.stock_room_id ?? null : null,
        to_stock_room_id: destType === "STOCKROOM" ? toStockRoomId ?? null : null,
        from_store_id: from?.stock_type === "STORE" ? from?.store_id ?? null : null,
        to_store_id: destType === "STORE" ? toStoreId ?? null : null,
        should_notify_owner: false,
    };
}

function useCreateStockMovement(loadOrderId: number, onAfterSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { newStockMovement: StockMovementType }) => {
            return await createStockMovement(data.newStockMovement);
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ["load-order", loadOrderId],
                exact: true,
            });
            onAfterSuccess?.();
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast("Error al crear movimiento de stock", {
                description: errorMessage,
            });
        },
    });
}


export function StockMovement({
    loadOrderId,
    lot,
    stocks,
}: {
    loadOrderId: number;
    lot: Lot;
    stocks: StockWithRelations[];
}) {
    const [open, setOpen] = useState(false);

    const [selectedFromId, setSelectedFromId] = useState<number | null>(null);
    const selectedFrom = useMemo(
        () => stocks.find((s) => s.stock_id === selectedFromId),
        [stocks, selectedFromId]
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
            setDestType("");
            setToStoreId(null);
            setToStockRoomId(null);
            setQuantity("");
        }
    }, [open]);

    const resetForm = () => {
        setSelectedFromId(null);
        setDestType("");
        setToStoreId(null);
        setToStockRoomId(null);
        setQuantity("");
    };
    const createMovement = useCreateStockMovement(loadOrderId, () => {
        // Keep dialog open, reset form, and values will refresh via query refetch
        resetForm();
    });

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
            lot,
            from: selectedFrom,
            destType,
            toStoreId,
            toStockRoomId,
            quantity: Number(quantity),
        });
        await createMovement.mutateAsync({ newStockMovement: payload });
    };

    const totalQty = (stocks ?? []).reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0);

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
                                    {(stocks ?? []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground">
                                                Sin stock asociado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (stocks ?? [])
                                            .sort((a, b) => a.stock_type.localeCompare(b.stock_type))
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
                                                                    onChange={() => setSelectedFromId(item.stock_id ?? null)}
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
                                onValueChange={(v: string) => setSelectedFromId(Number(v))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar origen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(stocks ?? []).map((item) => {
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
                                <StoreSelector value={toStoreId} onChange={setToStoreId} disabled={false} />
                            )}
                            {destType === "STOCKROOM" && (
                                <StockRoomSelector value={toStockRoomId} onChange={setToStockRoomId} disabled={false} />
                            )}
                        </div>

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
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={fromMissing || qtyInvalid || destMissing || sameLocation}
                    >
                        Registrar movimiento
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
