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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/utils";



function getFromLabel(m: LotContainerMovement) {
    if (m.from_store_name) return `Tienda: ${m.from_store_name}`;
    if (m.from_stock_room_name) return `Depósito: ${m.from_stock_room_name}`;
    if (m.from_client_name) return `Cliente: ${m.from_client_name}`;
    if (m.from_provider_name) return `Proveedor: ${m.from_provider_name}`;
    return "-";
}

function getToLabel(m: LotContainerMovement) {
    if (m.to_store_name) return `Tienda: ${m.to_store_name}`;
    if (m.to_stock_room_name) return `Depósito: ${m.to_stock_room_name}`;
    if (m.to_client_name) return `Cliente: ${m.to_client_name}`;
    if (m.to_provider_name) return `Proveedor: ${m.to_provider_name}`;
    return "-";
}

const LotContainerHistoricalMvts = ({
    lotContainerId,
}: {
    lotContainerId: number;
}) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["lot-container-movements", lotContainerId],
        queryFn: async () => {
            const res = await getLotContainersMovements(lotContainerId);
            return res.lotContainersMovements ?? [];
        },
        enabled: !!lotContainerId,
    });

    const movements: LotContainerMovement[] = useMemo(() => data ?? [], [data]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotContainerId}>
                    Ver historial de movimientos
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                <div className="flex h-full flex-col">
                    <div className="border-b px-6 py-4">
                        <SheetHeader>
                            <SheetTitle>Histórico de movimientos</SheetTitle>
                            <SheetDescription>
                                Contenedor #{lotContainerId ?? "-"}
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
                                No hay movimientos para este contenedor.
                            </div>
                        )}

                        {!isLoading && !isError && movements.length > 0 && (
                            <div className="px-6 py-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[140px]">Fecha</TableHead>
                                            <TableHead>Desde</TableHead>
                                            <TableHead>Hacia</TableHead>
                                            <TableHead className="text-right w-[120px]">Cantidad</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements
                                            .slice()
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .map((m) => (
                                                <TableRow key={m.lot_container_movement_id}>
                                                    <TableCell>{formatDate(m.created_at)}</TableCell>
                                                    <TableCell>{getFromLabel(m)}</TableCell>
                                                    <TableCell>{getToLabel(m)}</TableCell>
                                                    <TableCell className="text-right">{m.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default LotContainerHistoricalMvts;