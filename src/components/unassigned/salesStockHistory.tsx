
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getStockSalesHistory } from "@/service/stockMovement";
import type { StockSalesHistoryRow } from "@/types/SALES";
import { formatDate } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

const SalesStockHistory = ({
    lotId,
}: {
    lotId: number;
}) => {
    const { data: stockSales, isLoading, isError, error } = useQuery<StockSalesHistoryRow[]>({
        queryKey: ["stock-sales-history", lotId],
        queryFn: () => getStockSalesHistory(lotId!),
        enabled: !!lotId,
    });


    const salesWithTotals = useMemo(() => {
        let runningTotal = 0;
        return stockSales?.sort((a, b) => a.movement_date.localeCompare(b.movement_date)).map((m) => {
            const subtotal = m.price * m.quantity;
            runningTotal += subtotal;
            return {
                ...m,
                subtotal,
                runningTotal,
            };
        });
    }, [stockSales]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotId}>
                    Ver historial de ventas STOCK
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                <div className="flex h-full flex-col">
                    <div className="border-b px-6 py-4">
                        <SheetHeader>
                            <SheetTitle>Histórico de ventas</SheetTitle>
                            <SheetDescription>
                                Lote #{lotId ?? "-"}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading && (
                            <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando ventas...
                            </div>
                        )}

                        {isError && (
                            <div className="p-6 text-sm text-red-600">
                                Error al cargar movimientos: {error instanceof Error ? error.message : "Desconocido"}
                            </div>
                        )}

                        {!isLoading && !isError && stockSales.length === 0 && (
                            <div className="p-6 text-sm text-muted-foreground">
                                No hay movimientos de ventas para este lote.
                            </div>
                        )}

                        {!isLoading && !isError && stockSales.length > 0 && (
                            <div className="px-6 py-4">

                                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                                    <div className="col-span-3">Fecha</div>
                                    <div className="col-span-3">Cantidad Vendida</div>
                                    <div className="col-span-2 text-right">Precio</div>
                                    <div className="col-span-2 text-right">Subtotal</div>
                                    <div className="col-span-2 text-right">Total Acumulado</div>
                                </div>

                                <div className="divide-y">
                                    {salesWithTotals?.map((m) => {
                                        return (
                                            <div
                                                key={m.movement_id}
                                                className="grid grid-cols-12 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-3">{formatDate(m.movement_date)}</div>
                                                <div className="col-span-3 truncate">{m.quantity}</div>

                                                <div className="col-span-2 text-right">{m.price}</div>
                                                <div className="col-span-2 text-right">{(m?.subtotal)}</div>

                                                <div className="col-span-2 text-right">{(m?.runningTotal)}</div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SalesStockHistory;