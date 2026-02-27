


// ─── Timeline event card ─────────────────────────────────────────────────────

import type { LotSaleRow } from "@/service/lotHistory";
import { formatDate } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { ShoppingCart } from "lucide-react";

export function SaleCard({ data }: { data: LotSaleRow }) {
    const presentation = data.product_presentations;
    const presentationName = presentation?.product_presentation_name;
    const baseUnitLabel = presentation?.sell_unit === "BY_WEIGHT" ? "kg" : "un.";
    const showBaseUnits =
        data.qty_in_base_units != null &&
        presentation?.bulk_quantity_equivalence != null &&
        presentation.bulk_quantity_equivalence !== 1;

    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="mb-4 flex-1 rounded-lg border border-green-200 bg-green-50/40 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-xs font-medium text-green-700">Venta</span>
                        <p className="text-sm font-medium">
                            Orden #{data.orders?.order_number ?? "—"}
                        </p>
                        {presentationName && (
                            <p className="text-xs text-muted-foreground">
                                {data.quantity} {presentationName}
                            </p>
                        )}
                        {showBaseUnits && (
                            <p className="text-xs text-muted-foreground">
                                = {data.qty_in_base_units} {baseUnitLabel}
                            </p>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-green-700">{formatCurrency(data.total)}</p>
                        <p className="text-xs text-muted-foreground">
                            {data.quantity} × {formatCurrency(data.price)}
                        </p>
                    </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(data.created_at)}</p>
            </div>
        </div>
    );
}


