"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getStockRooms } from "@/service/stockRooms";
import { getUserStores } from "@/service/stores";
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type Props = {
    lots: Lot[];
};

export const StockLocationTable = ({ lots }: Props) => {
    const [perLotView, setPerLotView] = useState(false);

    const {
        data: stores = [],
        isLoading: isLoadingStores,
        isError: isErrorStores,
    } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getUserStores();
            return response.stores;
        },
    });

    const {
        data: stockRooms = [],
        isLoading: isLoadingStockRooms,
        isError: isErrorStockRooms,
    } = useQuery({
        queryKey: ["stock-rooms"],
        queryFn: async () => {
            const response = await getStockRooms();
            return response.stockRooms;
        },
    });

    // Detecta si hay algún stock no asignado
    const hasUnassigned = useMemo(() => {
        return lots.some((lot) =>
            lot.stock?.some((s) => s.stock_type === "NOT ASSIGNED")
        );
    }, [lots]);

    const getStockSummary = useCallback((stocks: Stock[]) => {
        const summary: Record<string, number> = {
            total: 0,
            unassigned: 0,
        };

        stores.forEach((store) => (summary[`store_${store.store_id}`] = 0));
        stockRooms.forEach(
            (room) => (summary[`stockroom_${room.stock_room_id}`] = 0)
        );

        for (const s of stocks) {
            summary.total += s.current_quantity;

            switch (s.stock_type) {
                case "NOT ASSIGNED":
                    summary.unassigned += s.current_quantity;
                    break;
                case "STORE":
                    if (s.store_id)
                        summary[`store_${s.store_id}`] += s.current_quantity;
                    break;
                case "STOCKROOM":
                    if (s.stock_room_id)
                        summary[`stockroom_${s.stock_room_id}`] += s.current_quantity;
                    break;
            }
        }

        return summary;
    }, [stores, stockRooms]);

    const combinedSummary = useMemo(() => {
        const allStocks = lots.flatMap((lot) => lot.stock ?? []);
        return getStockSummary(allStocks);
    }, [lots, getStockSummary]);

    const headers = useMemo(() => {
        const base = ["Total"];
        if (hasUnassigned) base.push("No asignado");
        stores.forEach((store) => base.push(store.store_name || `Punto de venta ${store.store_id}`));
        stockRooms.forEach((room) =>
            base.push(room.stock_room_name || `Depósito ${room.stock_room_id}`)
        );
        base.push("Acciones");
        return base;
    }, [stores, stockRooms, hasUnassigned]);


    if (isLoadingStores || isLoadingStockRooms) {
        return <div>Cargando ubicaciones...</div>;
    }

    if (isErrorStores || isErrorStockRooms) {
        return <div>Error al cargar las ubicaciones.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="viewSwitch" className="text-sm font-medium">
                    {perLotView ? "Vista por lote" : "Vista total"}
                </Label>
                <Switch
                    id="viewSwitch"
                    checked={perLotView}
                    onCheckedChange={setPerLotView}
                />
            </div>

            <div className="rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">
                                {perLotView ? "Lotes" : "Producto"}
                            </TableHead>
                            {headers.map((header) => (
                                <TableHead
                                    key={header}
                                    className="text-right whitespace-nowrap"
                                >
                                    {header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {perLotView ? (
                            lots.map((lot) => {
                                const summary = getStockSummary(lot.stock ?? []);
                                return (
                                    <TableRow key={lot.lot_id ?? Math.random()}>
                                        <TableCell className="font-medium">
                                            Lote #{lot.lot_number ?? "-"}
                                        </TableCell>

                                        <TableCell className="text-right">{summary.total}</TableCell>

                                        {hasUnassigned && (
                                            <TableCell className="text-right">
                                                {summary.unassigned || "--"}
                                            </TableCell>
                                        )}

                                        {stores.map((store) => (
                                            <TableCell
                                                key={store.store_id}
                                                className="text-right"
                                            >
                                                {summary[`store_${store.store_id}`] || "--"}
                                            </TableCell>
                                        ))}

                                        {stockRooms.map((room) => (
                                            <TableCell
                                                key={room.stock_room_id}
                                                className="text-right"
                                            >
                                                {summary[`stockroom_${room.stock_room_id}`] || "--"}
                                            </TableCell>
                                        ))}

                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell className="font-medium">Lotes combinados</TableCell>

                                <TableCell className="text-right">
                                    {combinedSummary.total}
                                </TableCell>

                                {hasUnassigned && (
                                    <TableCell className="text-right">
                                        {combinedSummary.unassigned || "--"}
                                    </TableCell>
                                )}

                                {stores.map((store) => (
                                    <TableCell
                                        key={store.store_id}
                                        className="text-right"
                                    >
                                        {combinedSummary[`store_${store.store_id}`] || "--"}
                                    </TableCell>
                                ))}

                                {stockRooms.map((room) => (
                                    <TableCell
                                        key={room.stock_room_id}
                                        className="text-right"
                                    >
                                        {combinedSummary[`stockroom_${room.stock_room_id}`] || "--"}
                                    </TableCell>
                                ))}

                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default StockLocationTable;
