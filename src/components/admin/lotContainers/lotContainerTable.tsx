import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { LotContainer } from "@/types/lotContainers";
import LotContainerHistoricalMvts from "./lotContainerHistoricalMvts";
import { formatCurrency, formatDate } from "@/utils";

const LotContainerTable = ({ lotContainers = [] }: { lotContainers?: LotContainer[] }) => {
    return (
        <div className="rounded-md">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Total: {lotContainers.length}</div>

                <Button size="sm">Agregar contenedor</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-[140px]">Precio</TableHead>
                        <TableHead className="w-[180px]">Creado</TableHead>
                        <TableHead className="text-right w-[160px]">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lotContainers.length > 0 ? (
                        lotContainers.map((lc) => (
                            <TableRow key={lc.lot_container_id}>
                                <TableCell>{lc.lot_container_id}</TableCell>
                                <TableCell>{lc.lot_container_name}</TableCell>
                                <TableCell>{formatCurrency(Number(lc.lot_container_price))}</TableCell>
                                <TableCell>{formatDate(lc.created_at)}</TableCell>
                                <TableCell className="text-right">
                                    <LotContainerHistoricalMvts lotContainerId={lc.lot_container_id} />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                No hay contenedores.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default LotContainerTable;