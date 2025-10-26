/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Lot } from '@/types/lots'
import type { Product } from '@/types/products'
import type { Stock } from '@/types/stocks'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StockMovement } from '../stock/stockMovement'
import { DeleteTableElementPopUp } from './deleteTableElementPopUp'
import ManageStockPrices from './manageStockPricesUNUSED'
import SalesHistory from '@/components/unassigned/salesHistory'
import SalesStockHistory from '@/components/unassigned/salesStockHistory'
import { ManageStockBtn } from './manageStockBtn'

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
    <div className="">
        {children}
    </div>
)


const columnHelper = createColumnHelper<Product>()

const columns = [
    columnHelper.accessor('product_id', {
        header: () => <HeaderCell>Acciones</HeaderCell>,
        cell: info => <div className='flex gap-2'>                <DeleteTableElementPopUp
            elementId={info.getValue() || ''}
            queryKey={['products']}
            deleteFn={async (id) => {
                // Simula una llamada a una API para eliminar el producto
                return new Promise((resolve) => {
                    setTimeout(() => {
                        console.log(`Producto eliminado: ${id}`);
                        resolve(true);
                    }, 1000);
                });
            }}
            elementName="el producto"
            size="icon"
            successMsgTitle="Elemento eliminado"
            successMsgDescription="El producto ha sido eliminado correctamente."
            errorMsgTitle="Error al eliminar"
            errorMsgDescription="No se pudo eliminar el producto."
        />
            <ManageStockBtn productId={Number(info.getValue()!)} />
        </div>
        ,

        footer: info => info.column.id,
    }),

    // Nombre
    columnHelper.accessor("product_name", {
        header: () => <HeaderCell>Nombre</HeaderCell>,
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
    }),



    // Categoría
    columnHelper.accessor((row) => row.categories?.category_name ?? "--", {
        id: "category",
        header: () => <HeaderCell>Categoría</HeaderCell>,
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
    }),

    // Subcategoría
    columnHelper.accessor((row) => row.sub_categories?.sub_category_name ?? "--", {
        id: "sub_category",
        header: () => <HeaderCell>Subcategoría</HeaderCell>,
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
    }),

    // Marca
    columnHelper.accessor((row) => row.brands?.brand_name ?? "--", {
        id: "brand",
        header: () => <HeaderCell>Marca</HeaderCell>,
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
    }),

    // Código de barras
    columnHelper.accessor("barcode", {
        header: () => <HeaderCell>Barcode</HeaderCell>,
        cell: (info) => info.getValue() ?? "--",
        footer: (info) => info.column.id,
    }),

    // Control de stock
    columnHelper.accessor("allow_stock_control", {
        header: () => <HeaderCell>Con control de stock</HeaderCell>,
        cell: (info) => (info.getValue() ? "Sí" : "No"),
        footer: (info) => info.column.id,
    }),

    columnHelper.accessor("lots", {
        header: () => <HeaderCell>Tiene stock</HeaderCell>,
        cell: (info) => (Array.isArray(info.getValue()) && (info.getValue()?.length ?? 0) > 0 ? "Sí" : "No"),
        footer: (info) => info.column.id,
    }),

    // Control de lotes
    columnHelper.accessor("lot_control", {
        header: () => <HeaderCell>Lotes</HeaderCell>,
        cell: (info) => (info.getValue() ? "Sí" : "No"),
        footer: (info) => info.column.id,
    }),

    // Fecha creación
    columnHelper.accessor("created_at", {
        header: () => <HeaderCell>Creado</HeaderCell>,
        cell: (info) =>
            info.getValue()
                ? new Date(info.getValue() as string).toLocaleDateString("es-AR")
                : "--",
        footer: (info) => info.column.id,
    }),
]

// FIXME DEberia ser igual que en la tabla del loadOrder UNIFICAR

const lotColumnHelper = createColumnHelper<Lot>();

const lotColumns = [
    // lotColumnHelper.accessor("lot_id", {
    //     header: "ID Lote",
    //     cell: info => info.getValue(),
    // }),
    lotColumnHelper.accessor("lot_number", {
        header: "Número de Lote",
        cell: info => info.getValue() ?? "--",
    }),
    lotColumnHelper.accessor("expiration_date", {
        header: "Vencimiento",
        cell: info => {
            const value = info.getValue() as string | null;
            return value ? new Date(value).toLocaleDateString("es-AR") : "--";
        },
    }),
    // lotColumnHelper.accessor("current_quantity", {
    //     header: "Cantidad",
    //     cell: info => info.getValue() ?? 0,
    // }),

    lotColumnHelper.accessor("stockData", {
        header: "Mover Stock",
        cell: info => {
            const stockData = info.getValue() as {
                stock?: Stock;
                lot_number: number,
                lot_id: number,
                totalQty: number | null,
            };

            if (!stockData.stock) return <span>--</span>;



            return <div className='flex  gap-2'>
                <StockMovement
                    lotId={stockData.lot_id}
                    aditionalQueryKey={["products"]}
                />

                <SalesStockHistory lotId={stockData.lot_id} />
                <SalesHistory lotId={stockData.lot_id} />
            </div>
        }
    }),



    lotColumnHelper.accessor("stockData", {
        header: "Precios",
        cell: (info) => {
            const stockData = info.getValue() as {
                purchase_cost_per_unit: number | null;
                stock?: Stock;
                lot_number: number,
                lot_id: number,
            };

            console.log("Stock Data in Lot Column:", stockData);

            if (!stockData) return <span>--</span>;

            const { stock } = stockData;
            const isStore = !!stock?.store_id;

            return isStore ? (
                <ManageStockPrices
                    hasCost={stockData.purchase_cost_per_unit != null && stockData.purchase_cost_per_unit > 0}
                    loadOrderId={123} // 👈 ID real
                    storeId={stock?.store_id ?? null}
                    productId={stock?.product_id ?? 0}
                    lotNumber={stockData.lot_number ?? 0}
                    stockId={stock?.stock_id || 0}
                    cost_per_unit={stockData.purchase_cost_per_unit ?? 0}
                    lotId={stockData.lot_id ?? 0}
                />
            ) : (
                <span>Sin precios</span>
            );
        },
    }),

];

// <StockMovement
//                     loadOrderId={Number(loadOrderId)}
//                     lot={lot as Lot}
//                     stocks={stocks}
//                   />


export function ProductTableRendererClientSide({
    defaultData,
}: {
    defaultData: Product[]
}) {
    console.log("Rendering ProductTableRendererClientSide with data:", defaultData);
    // const [data, setData] = React.useState(() => [...defaultData])



    const [pagination, setPagination] = React.useState({
        pageIndex: 0, //initial page index
        pageSize: 10, //default page size
    });


    const table = useReactTable({
        data: defaultData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        // getFilteredRowModel: getFilteredRowModel(),
        onPaginationChange: setPagination,
        state: {
            pagination,
        },
        // lots are a different type (Lot[]), so coerce types to satisfy the table generics
        getSubRows: (row: any) => (row.lots ?? []) as unknown as Product[],  // return the children array as sub-rows
    })

    return (
        <>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
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
                    {table.getRowModel().rows.map(row => (
                        <React.Fragment key={row.id}>
                            <TableRow>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}

                                <TableCell>
                                    {row.getCanExpand() && (
                                        <button onClick={row.getToggleExpandedHandler()}>
                                            {row.getIsExpanded() ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
                                        </button>
                                    )}
                                </TableCell>
                            </TableRow>

                            {row.getIsExpanded() && (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {lotColumns.map((col, idx) => (
                                                        <TableHead key={idx}>{col.header as any}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {row.original.lots?.map((lot: any, idx: number) => (
                                                    <TableRow key={idx}>
                                                        {lotColumns.map((col: any, j) => (
                                                            <TableCell key={j}>
                                                                {typeof col.cell === "function"
                                                                    ? col.cell({ getValue: () => lot[col.accessorKey], row: { original: lot } })
                                                                    : lot[col.accessorKey]}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableHead colSpan={table.getAllColumns().length}>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2">

                                {/* Info de páginas */}
                                <div className="text-sm text-muted-foreground">
                                    Página{" "}
                                    <strong>
                                        {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                                    </strong>{" "}
                                    | Mostrando{" "}
                                    {table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1}
                                    –
                                    {Math.min(
                                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                        table.getRowCount()
                                    )}{" "}
                                    de {table.getRowCount()} registros
                                </div>

                                {/* Controles de paginación */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.firstPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        {"<<"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        {"<"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        {">"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.lastPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        {">>"}
                                    </Button>
                                </div>

                                {/* Selector de tamaño de página */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Filas por página:</span>
                                    <select
                                        className="border rounded-md p-1 text-sm"
                                        value={table.getState().pagination.pageSize}
                                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                                    >
                                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                            <option key={pageSize} value={pageSize}>
                                                {pageSize}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </TableHead>
                    </TableRow>
                </TableFooter>

            </Table>
            <div className="h-4" />

        </>
    )
}

