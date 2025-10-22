
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getSalesHistoryByProductOrLot } from "@/service/stockMovement";
import type { SalesHistoryRow } from "@/types/SALES";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const SalesHistory = ({
    lotId,
}: {
    lotId: number;
}) => {
    const { data: sales, isLoading, isError, error } = useQuery<SalesHistoryRow[]>({
        queryKey: ["sales-history", lotId],
        queryFn: () => getSalesHistoryByProductOrLot(lotId!),
        enabled: !!lotId,
    });

    // const salesWithTotals = useMemo(() => {
    //     let runningTotal = 0;
    //     return sales?.sort((a, b) => a?.order_date.localeCompare(b.order_date)).map((m) => {
    //         const subtotal = m.unit_price * m.quantity;
    //         runningTotal += subtotal;
    //         return {
    //             ...m,
    //             subtotal,
    //             runningTotal,
    //         };
    //     });
    // }, [sales]);

    console.log("salesWithTotals:", sales);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotId}>
                    Ver historial de ventas
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

                        {!isLoading && !isError && sales?.length === 0 && (
                            <div className="p-6 text-sm text-muted-foreground">
                                No hay movimientos de ventas para este lote.
                            </div>
                        )}

                        {/* {!isLoading && !isError && (salesWithTotals?.length ?? 0) > 0 && (
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
                                                key={m.order_id}
                                                className="grid grid-cols-12 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-3">{formatDate(m.order_date)}</div>
                                                <div className="col-span-3 truncate">{m.quantity}</div>

                                                <div className="col-span-2 text-right">{m.unit_price}</div>
                                                <div className="col-span-2 text-right">{(m?.subtotal)}</div>

                                                <div className="col-span-2 text-right">{(m?.runningTotal)}</div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )} */}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SalesHistory;