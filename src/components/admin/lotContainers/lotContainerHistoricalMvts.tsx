
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getLotContainersMovements } from "@/service/lotContainer";
import type { LotContainerMovement } from "@/types/lotContainerMovements";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";


function formatCurrency(value: number) {
    try {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `$${value.toFixed(2)}`;
    }
}

function formatDate(value: string) {
    try {
        return new Date(value).toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return value;
    }
}


const LotContainerHistoricalMvts = ({
    lotContainerId,
}: {
    lotContainerId: number;
}) => {

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["lot-container-movements", lotContainerId],
        queryFn: () => getLotContainersMovements(lotContainerId),
        enabled: !!lotContainerId,
    });

    console.log("Fetched transactions:", lotContainerId, data);

    const movements: LotContainerMovement[] = useMemo(() => data ?? [], [data]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotContainerId}>
                    Ver historial de movimietos
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                <div className="flex h-full flex-col">
                    <div className="border-b px-6 py-4">
                        <SheetHeader>
                            <SheetTitle>Histórico de movimientos</SheetTitle>
                            <SheetDescription>
                                Cliente #{lotContainerId ?? "-"}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading && (
                            <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando movimientos...
                            </div>
                        )}

                        {isError && (
                            <div className="p-6 text-sm text-red-600">
                                Error al cargar movimientos: {error instanceof Error ? error.message : "Desconocido"}
                            </div>
                        )}

                        {!isLoading && !isError && movements.length === 0 && (
                            <div className="p-6 text-sm text-muted-foreground">
                                No hay movimientos para este cliente.
                            </div>
                        )}

                        {!isLoading && !isError && movements.length > 0 && (
                            <div className="px-6 py-4">
                                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                                    <div className="col-span-3">Fecha</div>
                                    <div className="col-span-5">Detalle</div>
                                    <div className="col-span-2 text-right">Monto</div>
                                    <div className="col-span-2 text-right">Saldo después</div>
                                </div>

                                <div className="divide-y">
                                    {/* {movements.map((m) => {
                                        const detail =
                                            m.description ??
                                            (m.order_id ? `Orden #${m.order_id}` : "-");
                                        const after = m.balance_after_transaction ?? 0;
                                        const isDebt = after < 0; // rojo si < 0 (debe), verde si >= 0

                                        return (
                                            <div
                                                key={m.transaction_id}
                                                className="grid grid-cols-12 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-3">{formatDate(m.created_at)}</div>
                                                <div className="col-span-5 truncate">{detail}</div>

                                                {/* Monto de la transacción (informativo, sin énfasis) */}
                                    <div className="col-span-2 text-right text-muted-foreground">
                                        {formatCurrency(m.amount)}
                                    </div>

                                    {/* Saldo después de la transacción: foco principal */}
                                    <div
                                        className={
                                            "col-span-2 text-right font-semibold " +
                                            (isDebt ? "text-red-600" : "text-emerald-600")
                                        }
                                    >
                                        {formatCurrency(after)}
                                    </div>
                                </div>
                                );
                                    })} */}
                            </div>
                            </div>
                        )}
                </div>
            </div>
        </SheetContent>
        </Sheet >
    );
};

export default LotContainerHistoricalMvts;