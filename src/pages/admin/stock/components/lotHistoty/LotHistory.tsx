import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    getLotSalesRpc,
    getLotTransformationsRpc,
    getLotWastesRpc,
    type LotSaleRow,
    type LotTransformationRow,
    type LotWasteRow,
} from "@/service/lotHistory";
import { getLotStocks } from "@/service/stock";
import { formatCurrency } from "@/utils/prices";
import { useQuery } from "@tanstack/react-query";
import {
    Loader2,
    TrendingUp
} from "lucide-react";
import { useState } from "react";
import CloseLotDialog from "../CloseLotDialog";
import { OverSellPopover } from "./OversellPopover";
import { SaleCard } from "./SaleCard";
import { StatCard } from "./StatCard";
import { TransformOriginCard, TransformResultCard } from "./TransformCards";
import { WasteCard } from "./WasteCard";

// ─── Timeline event union ────────────────────────────────────────────────────

type SaleEvent = { kind: "sale"; date: string; data: LotSaleRow };
type TransformOriginEvent = { kind: "transform_origin"; date: string; data: LotTransformationRow };
type TransformResultEvent = { kind: "transform_result"; date: string; data: LotTransformationRow };
type WasteEvent = { kind: "waste"; date: string; data: LotWasteRow };
type TimelineEvent = SaleEvent | TransformOriginEvent | TransformResultEvent | WasteEvent;

type FilterType = "all" | "sale" | "transformation" | "waste";

type OverSoldStock = {
    stock_id: number;
    location_id: number | null;
    store_name: string | null;
    stock_room_name: string | null;
    over_sell_quantity: number;
};



// ─── Main component ──────────────────────────────────────────────────────────

const LotHistory = ({ lotId }: { lotId: number | null }) => {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");

    const enabled = open && !!lotId;

    const { data: sales = [], isLoading: loadingSales } = useQuery({
        queryKey: ["lot-sales-rpc", lotId],
        queryFn: () => getLotSalesRpc(lotId!),
        enabled,
    });

    const { data: transformations = [], isLoading: loadingTransformations } = useQuery({
        queryKey: ["lot-transformations-rpc", lotId],
        queryFn: () => getLotTransformationsRpc(lotId!),
        enabled,
    });

    const { data: wastes = [], isLoading: loadingWastes } = useQuery({
        queryKey: ["lot-wastes-rpc", lotId],
        queryFn: () => getLotWastesRpc(lotId!),
        enabled,
    });

    const { data: lotStocksRaw = [] } = useQuery({
        queryKey: ["lot-stocks", lotId],
        queryFn: async () => {
            const { lotStock } = await getLotStocks(lotId!);
            return lotStock;
        },
        enabled,
    });

    const overSoldStocks: OverSoldStock[] = lotStocksRaw
        .filter((s) => (s.over_sell_quantity ?? 0) > 0)
        .map((s) => ({
            stock_id: s.stock_id,
            location_id: s.location_id,
            store_name: s.store_name ?? null,
            stock_room_name: s.stock_room_name ?? null,
            over_sell_quantity: s.over_sell_quantity!,
        }));

    const isLoading = loadingSales || loadingTransformations || loadingWastes;

    // ── Stats ──────────────────────────────────────────────────────────────
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total ?? 0), 0);
    const totalBaseUnitsSold = sales.reduce((acc, s) => acc + (s.qty_in_base_units ?? 0), 0);
    const avgPrice = sales.length > 0
        ? sales.reduce((acc, s) => acc + (s.price ?? 0), 0) / sales.length
        : 0;

    // Sales stats: per-presentation breakdown
    const salesByPresentation = sales.reduce<Record<string, { qty: number; revenue: number }>>((acc, s) => {
        const name = s.product_presentations?.product_presentation_name ?? "Sin presentación";
        if (!acc[name]) acc[name] = { qty: 0, revenue: 0 };
        acc[name].qty += s.quantity ?? 0;
        acc[name].revenue += s.total ?? 0;
        return acc;
    }, {});
    const salesQtyBreakdown = Object.entries(salesByPresentation)
        .map(([name, { qty }]) => `${qty} ${name}`)
        .join(" · ");
    const salesRevenueBreakdown = Object.entries(salesByPresentation)
        .map(([name, { revenue }]) => `${name}: ${formatCurrency(revenue)}`)
        .join(" · ");
    const uniqueSalesSellUnits = [...new Set(
        sales.map(s => s.product_presentations?.sell_unit).filter((u): u is string => !!u)
    )];
    const salesTotalUnitLabel = uniqueSalesSellUnits.length === 1
        ? (uniqueSalesSellUnits[0] === "BY_WEIGHT" ? "kg" : "un.")
        : "u.b.";

    // Waste stats: total base units and per-presentation breakdown
    const totalBaseUnitsWasted = wastes.reduce((acc, w) => acc + (w.qty_in_base_units ?? 0), 0);
    const wasteByPresentation = wastes.reduce<Record<string, number>>((acc, w) => {
        const name = w.product_presentations?.product_presentation_name ?? "Sin presentación";
        acc[name] = (acc[name] ?? 0) + (w.quantity ?? 0);
        return acc;
    }, {});
    const wasteBreakdown = Object.entries(wasteByPresentation)
        .map(([name, qty]) => `${qty} ${name}`)
        .join(" · ");
    const uniqueSellUnits = [...new Set(
        wastes.map(w => w.product_presentations?.sell_unit).filter((u): u is string => !!u)
    )];
    const totalUnitLabel = uniqueSellUnits.length === 1
        ? (uniqueSellUnits[0] === "BY_WEIGHT" ? "kg" : "un.")
        : "u.b.";
    const wasteSub = wasteBreakdown
        ? `${wasteBreakdown} · ${wastes.length} ev.`
        : `${wastes.length} eventos`;

    // ── Timeline ───────────────────────────────────────────────────────────
    const allEvents: TimelineEvent[] = [
        ...sales.map((s): SaleEvent => ({ kind: "sale", date: s.created_at, data: s })),
        ...transformations.map((t): TransformOriginEvent | TransformResultEvent =>
            t.is_origin
                ? { kind: "transform_origin", date: t.transformation_date, data: t }
                : { kind: "transform_result", date: t.transformation_date, data: t }
        ),
        ...wastes.map((w): WasteEvent => ({ kind: "waste", date: w.created_at, data: w })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = allEvents.filter((e) => {
        if (filter === "all") return true;
        if (filter === "sale") return e.kind === "sale";
        if (filter === "transformation") return e.kind === "transform_origin" || e.kind === "transform_result";
        if (filter === "waste") return e.kind === "waste";
        return true;
    });

    const filters: { key: FilterType; label: string; count: number }[] = [
        { key: "all", label: "Todos", count: allEvents.length },
        { key: "sale", label: "Ventas", count: sales.length },
        { key: "transformation", label: "Transformaciones", count: transformations.length },
        { key: "waste", label: "Mermas", count: wastes.length },
    ];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!lotId}>
                    <TrendingUp className="h-4 w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-screen">

                {/* Header */}
                <div className="border-b px-6 py-4 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <SheetHeader>
                            <SheetTitle>Ciclo de vida del lote</SheetTitle>
                            <SheetDescription>Lote #{lotId ?? "—"}</SheetDescription>
                        </SheetHeader>
                        <OverSellPopover stocks={overSoldStocks} lotId={lotId!} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando historial...
                    </div>
                ) : (
                    <>
                        {/* Stats bar */}
                        <div className="grid grid-cols-2 gap-3 px-6 py-4 shrink-0 border-b">
                            <StatCard
                                label="Total recaudado"
                                value={formatCurrency(totalRevenue)}
                                sub={salesRevenueBreakdown || `${sales.length} ventas`}
                            />
                            <StatCard
                                label="Unidades vendidas"
                                value={sales.length > 0 ? `${totalBaseUnitsSold} ${salesTotalUnitLabel}` : "0"}
                                sub={salesQtyBreakdown || `Precio prom. ${formatCurrency(avgPrice)}`}
                            />
                            <StatCard
                                label="Transformaciones"
                                value={String(transformations.length)}
                            />
                            <StatCard
                                label="Mermas"
                                value={wastes.length > 0 ? `${totalBaseUnitsWasted} ${totalUnitLabel}` : "0"}
                                sub={wastes.length > 0 ? wasteSub : undefined}
                            />
                        </div>

                        {/* Filter chips */}
                        <div className="flex gap-2 px-6 py-3 shrink-0 border-b flex-wrap">
                            {filters.map(({ key, label, count }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
                                        ${filter === key
                                            ? "bg-foreground text-background"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {label}
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                        {count}
                                    </Badge>
                                </button>
                            ))}
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {filtered.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No hay eventos para mostrar.
                                </p>
                            ) : (
                                <div>
                                    {filtered.map((event, idx) => {
                                        if (event.kind === "sale")
                                            return <SaleCard key={`sale-${event.data.order_item_id}-${idx}`} data={event.data} />;
                                        if (event.kind === "transform_origin")
                                            return <TransformOriginCard key={`to-${event.data.transformation_item_id}-${idx}`} data={event.data} />;
                                        if (event.kind === "transform_result")
                                            return <TransformResultCard key={`tr-${event.data.transformation_item_id}-${idx}`} data={event.data} />;
                                        if (event.kind === "waste")
                                            return <WasteCard key={`waste-${event.data.stock_movement_id}-${idx}`} data={event.data} />;
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="border-t px-6 py-4 shrink-0">
                    <CloseLotDialog lotId={lotId} onClose={() => setOpen(false)} />
                </div>

            </SheetContent>
        </Sheet>
    );
};

export default LotHistory;
