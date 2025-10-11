import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import { formatDate } from "@/utils";


function getLocation(loc: LotContainersLocation) {
    if (loc.store_name) return { type: "Tienda", name: loc.store_name };
    if (loc.stock_room_name) return { type: "Depósito", name: loc.stock_room_name };
    if (loc.client_name) return { type: "Cliente", name: loc.client_name };
    if (loc.provider_name) return { type: "Proveedor", name: loc.provider_name };
    return { type: "-", name: "-" };
}

const LotContainersLocationTable = ({ locations = [] }: { locations?: LotContainersLocation[] }) => {
    return (
        <div className="rounded-md">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Total ubicaciones: {locations.length}</div>
                <Button size="sm">Mover vacíos</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="w-[110px]">Contenedor</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead className="w-[140px]">Tipo</TableHead>
                        <TableHead className="w-[120px]">Cantidad</TableHead>
                        <TableHead className="w-[180px]">Fecha</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {locations.length > 0 ? (
                        locations
                            .slice()
                            .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
                            .map((loc) => {
                                const { type, name } = getLocation(loc);
                                return (
                                    <TableRow key={loc.lot_containers_location_id}>
                                        <TableCell>{loc.lot_containers_location_id}</TableCell>
                                        <TableCell>{loc.lot_container_id ?? "-"}</TableCell>
                                        <TableCell>{name}</TableCell>
                                        <TableCell>{type}</TableCell>
                                        <TableCell>{loc.quantity ?? 0}</TableCell>
                                        <TableCell>{formatDate(loc?.created_at || "--")}</TableCell>
                                    </TableRow>
                                );
                            })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                No hay ubicaciones de contenedores.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default LotContainersLocationTable;