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
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type StockWithRelations = Stock & {
    stores?: { store_name?: string } | null;
    stock_rooms?: { stock_room_name?: string } | null;
};

export const formatStockLocation = (stockItem: StockWithRelations) => {
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

    const [expandedLots, setExpandedLots] = useState<Record<number, boolean>>({});

    const toggleExpanded = (lotId?: number) => {
        if (!lotId) return;
        setExpandedLots((prev) => ({ ...prev, [lotId]: !prev[lotId] }));
    };

    const lots = loadOrder?.lots ?? [];

    const lotsWithTotals = useMemo(() => {
        return lots.map((lot) => {
            const stocks = (lot.stock as StockWithRelations[] | undefined) ?? [];
            const totalQty = stocks.reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0);
            return { lot, stocks, totalQty };
        });
    }, [lots]);

    if (isLoading) return <div className="space-y-6 p-6">
        <TableSkl />
    </div>;
    if (isError) return <div className="pt-14">Error al cargar el remito.</div>;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Remito #{loadOrder?.load_order_number ?? "--"}
                </h1>
                <div className="space-y-0.5">

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
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Cantidad total</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lotsWithTotals.length > 0 ? (
                            lotsWithTotals.map(({ lot, stocks, totalQty }) => {
                                const hasStock = stocks.length > 0;
                                const isExpanded = !!(lot.lot_id && expandedLots[lot.lot_id]);

                                return (
                                    <Fragment key={lot.lot_id ?? Math.random()}>
                                        <TableRow>
                                            <TableCell className="p-0">
                                                <button
                                                    type="button"
                                                    className={`h-8 w-8 flex items-center justify-center rounded hover:bg-muted ${!hasStock ? "opacity-40 cursor-not-allowed" : ""}`}
                                                    onClick={() => hasStock && toggleExpanded(lot.lot_id)}
                                                    aria-label={isExpanded ? "Contraer" : "Expandir"}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="max-w-[280px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{lot?.product_name || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{lot.lot_number ?? "--"}</TableCell>
                                            <TableCell>{lot.expiration_date ?? "--"}</TableCell>
                                            <TableCell>{totalQty}</TableCell>
                                            <TableCell className="text-right">
                                                <StockMovement
                                                    loadOrderId={Number(loadOrderId)}
                                                    lot={lot as Lot}
                                                    stocks={stocks}
                                                />
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="bg-muted/30 p-0">
                                                    <div className="p-3">
                                                        <div className="text-sm mb-2 font-medium">Distribución por ubicación</div>
                                                        <div className="rounded border">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Ubicación</TableHead>
                                                                        <TableHead>Tipo</TableHead>
                                                                        <TableHead>Cantidad</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {hasStock ? (
                                                                        stocks.map((stockItem) => {
                                                                            const { typeLabel, nameLabel } = formatStockLocation(stockItem);
                                                                            return (
                                                                                <TableRow key={stockItem.stock_id}>
                                                                                    <TableCell className="max-w-[280px]">
                                                                                        <div className="flex flex-col">
                                                                                            <span>{nameLabel || typeLabel}</span>
                                                                                            {nameLabel && (
                                                                                                <span className="text-xs text-muted-foreground">{typeLabel}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>{typeLabel}</TableCell>
                                                                                    <TableCell>{stockItem.current_quantity}</TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <TableRow>
                                                                            <TableCell colSpan={3} className="text-muted-foreground">
                                                                                Sin stock asociado
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
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