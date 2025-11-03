import { LoadOrderTable } from "@/components/admin/loadOrder/LoadOrderTable";
import TableSkl from "@/components/admin/stock/ui/tableSkl";
import { getLoadOrder } from "@/service/loadOrders";
import { formatDate } from "@/utils";
import { type StockWithRelations } from "@/utils/stock";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";


// const formatLotsWithTotal



const TransferOrderContainer = () => {
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

    console.log("LoadOrder data:", loadOrder);

    const [expandedLots, setExpandedLots] = useState<Record<number, boolean>>({});

    const toggleExpanded = (lotId?: number) => {
        if (!lotId) return;
        setExpandedLots((prev) => ({ ...prev, [lotId]: !prev[lotId] }));
    };

    const lotsWithTotals = useMemo(() => {
        const lots = loadOrder?.lots ?? [];
        return lots.map((lot) => {
            const stocks = (lot.stock as StockWithRelations[] | undefined) ?? [];
            const totalQty = stocks.reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0);
            return { lot, stocks, totalQty };
        });
    }, [loadOrder]);

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
                        {formatDate(loadOrder?.delivery_date ?? "--")}

                    </p>
                </div>
            </div>
            <LoadOrderTable loadOrderId={Number(loadOrderId)} loadOrderData={lotsWithTotals} expandedLots={expandedLots} toggleExpanded={toggleExpanded} />
        </div>

    );
};


export default TransferOrderContainer;
