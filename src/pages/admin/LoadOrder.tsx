import { StockMovement } from "@/components/admin/stock/stockMovement";
import TableSkl from "@/components/admin/stock/ui/tableSkl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getLoadOrder } from "@/service/loadOrders";
import type { Stock } from "@/types/stocks";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

const LoadOrder = () => {
    const location = useLocation();
    const loadOrderId = location.pathname.split("/").pop() || "";


    const {
        data: loadOrder,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["load-order", Number(loadOrderId)],
        queryFn: async () => {
            const response = await getLoadOrder(loadOrderId);
            return response.dbLoadOrder;
        },
    });

    type StockWithRelations = Stock & {
        stores?: { store_name?: string } | null;
        stock_rooms?: { stock_room_name?: string } | null;
    };

    const formatStockLocation = (stockItem: StockWithRelations) => {
        const type = stockItem?.stock_type as string | undefined;
        if (type === "STORE") {
            const name = stockItem?.stores?.store_name || "Tienda";
            return { typeLabel: "Tienda", nameLabel: name };
        }
        if (type === "STOCKROOM") {
            const name = stockItem?.stock_rooms?.stock_room_name || "Depósito";
            return { typeLabel: "Depósito", nameLabel: name };
        }
        if (type === "NOT ASSIGNED") {
            return { typeLabel: "No asignado", nameLabel: "" };
        }
        if (type === "WASTE") {
            return { typeLabel: "Merma", nameLabel: "" };
        }
        if (type === "SOLD") {
            return { typeLabel: "Vendido", nameLabel: "" };
        }
        if (type === "TRANSFORMED") {
            return { typeLabel: "Transformado", nameLabel: "" };
        }
        return { typeLabel: type || "Otro", nameLabel: "" };
    };

    if (isLoading) return <TableSkl />;
    if (isError) return <div className="pt-14">Error al cargar el remito.</div>;

    return (
        <div className="pt-14 space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 px-1">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-semibold">
                        Remito #{loadOrder?.load_order_number ?? "--"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Proveedor: {loadOrder?.providers?.provider_name ?? "--"} · Factura:{" "}
                        {loadOrder?.invoice_number ?? "--"} · Fecha entrega:{" "}
                        {loadOrder?.delivery_date ?? "--"}
                    </p>
                </div>
            </div>

            <div className="rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Ubicación actual</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadOrder?.lots && loadOrder.lots.length > 0 ? (
                            loadOrder.lots.flatMap((lot) => {
                                const hasStock = lot.stock && lot.stock.length > 0;
                                if (!hasStock) {
                                    return [
                                        <TableRow key={`lot-${lot.lot_id}-empty`}>
                                            <TableCell className="max-w-[280px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {lot?.product_name || "N/A"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{lot.lot_number ?? "--"}</TableCell>
                                            <TableCell>{lot.expiration_date ?? "--"}</TableCell>
                                            <TableCell colSpan={3} className="text-muted-foreground">
                                                Sin stock asociado
                                            </TableCell>
                                            <TableCell className="text-right">—</TableCell>
                                        </TableRow>,
                                    ];
                                }

                                return lot.stock!.map((stockItem: StockWithRelations) => {
                                    const { typeLabel, nameLabel } = formatStockLocation(stockItem);
                                    return (
                                        <TableRow key={stockItem.stock_id}>
                                            <TableCell className="max-w-[280px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {lot?.product_name || "N/A"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{lot.lot_number ?? "--"}</TableCell>
                                            <TableCell>{lot.expiration_date ?? "--"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{typeLabel}</span>
                                                    {nameLabel && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {nameLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{stockItem.stock_type}</TableCell>
                                            <TableCell>{stockItem.current_quantity}</TableCell>
                                            <TableCell className="text-right">
                                                <StockMovement
                                                    loadOrderId={Number(loadOrderId)}
                                                    stockData={stockItem}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                });
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    No hay lotes en este remito
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default LoadOrder;