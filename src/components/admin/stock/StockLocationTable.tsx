"use client";
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
import { getLocations } from "@/service/locations";
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { formatDate } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

type Props = {
    lots: Lot[];
};

export const StockLocationTable = ({ lots }: Props) => {
    const [perLotView, setPerLotView] = useState(false);

    const {
        data: locations = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["locations"],
        queryFn: async () => {
            const response = await getLocations();
            return response.locations
        },
    });

    console.log(lots)


    // Detecta si hay algún stock no asignado
    const hasUnassigned = useMemo(() => {
        return lots.some((lot) =>
            lot.stock?.some((s) => !s.location_id)
        );
    }, [lots]);

    console.log(hasUnassigned)
    const getStockSummary = useCallback((stocks: Stock[]) => {
        const summary: Record<string, number> = {
            total: 0,
            unassigned: 0,
        };

        // Inicializar todas las locations
        locations.forEach((location) => {
            summary[`location_${location.location_id}`] = 0;
        });

        for (const s of stocks) {
            const qty = Number(s.quantity) || 0;
            summary.total += qty;


            if (s.location_id === null || s.location_id === undefined) {
                console.log("unassigned")
                summary.unassigned += qty;
                continue;
            }

            // Caso 2 → Ubicación asignada correctamente
            const key = `location_${s.location_id}`;
            if (key in summary) {
                summary[key] += qty;
            }
        }


        return summary;
    }, [locations]);


    const combinedSummary = useMemo(() => {
        const allStocks = lots.flatMap((lot) => lot.stock ?? []);
        return getStockSummary(allStocks);
    }, [lots, getStockSummary]);

    const headers = useMemo(() => {
        const base = ["Total"];
        if (hasUnassigned) base.push("No asignado");
        locations.forEach((location) =>
            base.push(location.name || `Localización ${location.location_id}`)
        );
        // base.push("Acciones");
        return base;
    }, [locations, hasUnassigned]);

    if (isLoading) {
        return <div>Cargando ubicaciones...</div>;
    }

    if (isError) {
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
                                            Lote: {formatDate(lot.created_at) ?? "-"}
                                        </TableCell>

                                        <TableCell className="text-right">{summary.total}</TableCell>

                                        {hasUnassigned && (
                                            <TableCell className="text-right">
                                                {summary.unassigned || "--"}
                                            </TableCell>
                                        )}



                                        {locations.map((location) => (
                                            <TableCell
                                                key={location.location_id}
                                                className="text-right"
                                            >
                                                {summary[`location_${location.location_id}`] || "--"}
                                            </TableCell>
                                        ))}

                                        {/* <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell> */}
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



                                {locations.map((location) => (
                                    <TableCell
                                        key={location.location_id}
                                        className="text-right"
                                    >
                                        {combinedSummary[`location_${location.location_id}`] || "--"}
                                    </TableCell>
                                ))}

                                {/* <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell> */}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default StockLocationTable;
