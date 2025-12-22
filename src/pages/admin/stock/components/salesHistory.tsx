
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getLotSales } from "@/service/orderItems";
import type { OrderItem } from "@/types/orderItems";
import { formatDate } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";

const SalesHistory = ({
    lotId,
}: {
    lotId: number | null;
}) => {
    const { data: sales, isLoading, isError, error } = useQuery({
        queryKey: ["lot-sales-history", lotId],
        queryFn: () => getLotSales(lotId!),
        enabled: !!lotId,
    });


    const salesTotal = sales?.reduce((acc, sale) => acc + (sale?.total || 0), 0) || 0;

    const salePricePromedio = sales && sales.length > 0 ? sales.reduce((acc, sale) => {
        return acc + (sale?.price || 0);
    }, 0) / sales.length : 0;


    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotId}>
                    <TrendingUp />
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

                        {!isLoading && !isError && (sales?.length ?? 0) > 0 && (
                            <div className="px-6 py-4">

                                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                                    <div className="col-span-3">Fecha</div>
                                    <div className="col-span-3">Cantidad Vendida</div>
                                    <div className="col-span-2 text-right">Precio</div>
                                    <div className="col-span-4 text-right">Total</div>
                                </div>

                                <div className="divide-y">
                                    {sales && sales.filter((s): s is OrderItem => s !== undefined).map((s: OrderItem) => {
                                        return (
                                            <div
                                                key={s.order_id}
                                                className="grid grid-cols-12 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-3">{formatDate(s.created_at)}</div>
                                                <div className="col-span-3 truncate">{s.quantity}</div>
                                                <div className="col-span-2 text-right">{formatCurrency(s.price)}</div>
                                                <div className="col-span-4 text-right">{formatCurrency(s.total)}</div>


                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="divide-y">

                                    <div
                                        className="grid grid-cols-12 gap-2 px-2 py-3 text-sm font-semibold border-t mt-4"
                                    >
                                        <div className="col-span-3"></div>
                                        <div className="col-span-3"></div>
                                        <div className="col-span-2 text-right">Promedio de precio de venta</div>
                                        <div className="col-span-4 text-right">{formatCurrency(salePricePromedio)}</div>
                                    </div>


                                    <div
                                        className="grid grid-cols-12 gap-2 px-2 py-3 text-sm font-semibold "
                                    >
                                        <div className="col-span-3"></div>
                                        <div className="col-span-3"></div>
                                        <div className="col-span-2 text-right">Total</div>
                                        <div className="col-span-4 text-right">{formatCurrency(salesTotal)}</div>
                                    </div>

                                    <div className="col-span-3"></div>

                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SalesHistory;