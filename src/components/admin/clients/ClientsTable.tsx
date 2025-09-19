import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types/clients";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import { deleteClient, updateClient } from "@/service/clients";
import { useEffect, useMemo, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ClientHistoricalMvts from "@/components/unassigned/clientHistoricalMvts";
import RegisterClientPayment from "@/components/unassigned/registerClientPayment";

interface ClientsTableProps {
    clients: Client[];
    filter?: string; // global filter text passed from container
}


export const ClientsTable = ({ clients, filter = "" }: ClientsTableProps) => {
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });



    // Reset to first page when filter changes
    useEffect(() => {
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [filter]);

    const columns = useMemo<ColumnDef<Client>[]>(() => {
        return [
            {
                id: "actions",
                header: "Acciones",
                cell: ({ row }) => {
                    const client = row.original;

                    return (
                        <div className="flex items-center gap-2">
                            {/* <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        await updateClientMutation.mutateAsync({
                                            id: client.client_id,
                                            updates: { is_active: !client.is_active },
                                        });
                                    } catch {
                                    }
                                }}
                            >
                                {client.is_active ? "Desactivar" : "Activar"}
                            </Button> */}

                            <DeleteTableElementPopUp
                                elementId={client.client_id}
                                elementName={client.full_name}
                                deleteFn={deleteClient}
                                queryKey={["clients"]}
                                successMsgTitle="Cliente eliminado"
                                successMsgDescription={`El cliente "${client.full_name}" ha sido eliminado.`}
                                errorMsgTitle="Error al eliminar cliente"
                                errorMsgDescription="No se pudo eliminar el cliente."
                            />

                            <ClientHistoricalMvts selectedClientId={client.client_id} />

                            <RegisterClientPayment clientId={client.client_id} clientName={client.full_name} currentBalance={client.current_balance} />
                        </div>
                    );
                },
            },
            {
                accessorKey: "full_name",
                header: "Nombre",
                cell: ({ row }) => row.original.full_name || "-",
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }) => row.original.email || "-",
            },
            {
                accessorKey: "phone",
                header: "Teléfono",
                cell: ({ row }) => row.original.phone || "-",
            },
            {
                accessorKey: "document_number",
                header: "Documento",
                cell: ({ row }) => row.original.document_number || "-",
            },
            {
                accessorKey: "address",
                header: "Dirección",
                cell: ({ row }) => row.original.address || "-",
            },
            {
                accessorKey: "city",
                header: "Ciudad",
                cell: ({ row }) => row.original.city || "-",
            },
            {
                accessorKey: "province",
                header: "Provincia",
                cell: ({ row }) => row.original.province || "-",
            },
            {
                accessorKey: "postal_code",
                header: "Código Postal",
                cell: ({ row }) => row.original.postal_code || "-",
            },
            {
                accessorKey: "country",
                header: "País",
                cell: ({ row }) => row.original.country || "-",
            },
            {
                accessorKey: "tax_ident",
                header: "Ident. Fiscal",
                cell: ({ row }) => row.original.tax_ident || "-",
            },
            {
                accessorKey: "credit_limit",
                header: "Límite de crédito",
                cell: ({ row }) =>
                    typeof row.original.credit_limit === "number"
                        ? row.original.credit_limit
                        : "-",
            },
            {
                accessorKey: "current_balance",
                header: "Balance actual",
                cell: ({ row }) =>
                    typeof row.original.current_balance === "number"
                        ? row.original.current_balance
                        : "-",
            },
            {
                accessorKey: "is_active",
                header: "Activo",
                cell: ({ row }) => (row.original.is_active ? "Sí" : "No"),
            },
            {
                accessorKey: "created_at",
                header: "Creado",
                cell: ({ row }) => row.original.created_at || "-",
            },
            {
                accessorKey: "updated_at",
                header: "Actualizado",
                cell: ({ row }) => row.original.updated_at || "-",
            },

        ];
    }, []); // columns are static

    const updateClientMutation = useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string | number;
            updates: Partial<Client>;
        }) => {
            return await updateClient(id, updates);
        },
        onSuccess: (updated) => {
            // Update the cache in-place for ["clients"]
            queryClient.setQueryData<Client[]>(["clients"], (prev) => {
                if (!prev) return prev as unknown as Client[];
                return prev.map((c) =>
                    c.client_id === updated.client_id ? { ...c, ...updated } : c
                );
            });
            toast("Cliente actualizado", {
                description: "Los cambios se guardaron correctamente.",
            });
        },
        onError: (error: unknown) => {
            const msg =
                (error as { message?: string })?.message ??
                "No se pudo actualizar el cliente.";
            toast("Error al actualizar", { description: msg });
        },
    });

    const table = useReactTable({
        data: clients,
        columns,
        state: {
            globalFilter: filter,
            pagination,
        },
        onPaginationChange: setPagination,
        getRowId: (row) => String(row.client_id),
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
                                {isFiltering ? "No se encontraron resultados" : "No tienes clientes"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

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
                        Total: {clients.length}
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