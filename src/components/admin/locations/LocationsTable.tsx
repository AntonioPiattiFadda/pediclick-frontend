import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { deleteLocation } from "@/service/locations";
import type { Location } from "@/types/locations";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { useEffect, useMemo, useState } from "react";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import { formatDate } from "@/utils";

interface LocationsTableProps {
    locations: Location[];
    filter?: string;
}

export const LocationsTable = ({ locations, filter = "" }: LocationsTableProps) => {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // Reset página cuando el filtro cambia
    useEffect(() => {
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [filter]);

    // ────────────────────────────────
    // Columnas
    // ────────────────────────────────
    const columns = useMemo<ColumnDef<Location>[]>(() => {
        return [
            {
                id: "actions",
                header: "Acciones",
                cell: ({ row }) => {
                    const loc = row.original;

                    return (
                        <div className="flex items-center gap-2">
                            <DeleteTableElementPopUp
                                elementId={loc.location_id ?? 0}
                                elementName={loc.name}
                                deleteFn={deleteLocation}
                                queryKey={["locations"]}
                                successMsgTitle="Ubicación eliminada"
                                successMsgDescription={`La ubicación "${loc.name}" ha sido eliminada.`}
                                errorMsgTitle="Error al eliminar ubicación"
                                errorMsgDescription="No se pudo eliminar la ubicación."
                            />
                        </div>
                    );
                },
            },
            {
                accessorKey: "type",
                header: "Tipo",
                cell: ({ row }) =>
                    row.original.type === "STORE" ? "Tienda" : "Depósito",
            },
            {
                accessorKey: "name",
                header: "Nombre",
                cell: ({ row }) => row.original.name || "-",
            },
            {
                accessorKey: "address",
                header: "Dirección",
                cell: ({ row }) => row.original.address || "-",
            },
            {
                accessorKey: "created_at",
                header: "Creado",
                cell: ({ row }) => formatDate(row.original.created_at) || "-",
            }
        ];
    }, []);

    // ────────────────────────────────
    // Tabla
    // ────────────────────────────────

    const table = useReactTable({
        data: locations,
        columns,
        state: {
            globalFilter: filter,
            pagination,
        },
        getRowId: (row) => String(row.location_id),
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const isFiltering = (filter ?? "").length > 0;

    return (
        <div className="rounded-md overflow-x-auto max-w-[80vw]">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="text-center">
                                {isFiltering
                                    ? "No se encontraron ubicaciones"
                                    : "No tienes ubicaciones"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* PAGINACIÓN */}
            <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">Filas por página</span>
                    <select
                        className="border rounded px-2 py-1 text-sm bg-background"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {[5, 10, 20, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-muted-foreground">
                        Total: {locations.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>

                    <span className="text-sm">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount() || 1}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
};
