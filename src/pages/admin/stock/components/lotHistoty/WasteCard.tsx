import type { LotWasteRow } from "@/service/lotHistory";
import { formatDate } from "@/utils";
import { Trash2 } from "lucide-react";

export function WasteCard({ data }: { data: LotWasteRow }) {
    const presentation = data.product_presentations;
    const presentationName = presentation?.product_presentation_name;
    const baseUnitLabel = presentation?.sell_unit === "BY_WEIGHT" ? "kg" : "un.";
    const showBaseUnits =
        data.qty_in_base_units != null &&
        presentation?.bulk_quantity_equivalence != null &&
        presentation.bulk_quantity_equivalence !== 1;
    const authorName = data.users?.full_name ?? data.users?.email;

    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Trash2 className="h-4 w-4" />
                </div>
                <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="mb-4 flex-1 rounded-lg border border-red-200 bg-red-50/40 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-xs font-medium text-red-700">Merma</span>
                        <p className="text-sm font-medium">
                            {data.quantity}{presentationName ? ` ${presentationName}` : " un."} descartado{(data.quantity ?? 0) !== 1 ? "s" : ""}
                        </p>
                        {showBaseUnits && (
                            <p className="text-xs text-muted-foreground">
                                = {data.qty_in_base_units} {baseUnitLabel}
                            </p>
                        )}
                        {authorName && (
                            <p className="text-xs text-muted-foreground">Por: {authorName}</p>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(data.created_at)}</p>
            </div>
        </div>
    );
}