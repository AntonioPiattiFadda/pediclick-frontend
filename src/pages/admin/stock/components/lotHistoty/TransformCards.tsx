import type { LotTransformationRow } from "@/service/lotHistory";
import { formatDate } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export function TransformOriginCard({ data }: { data: LotTransformationRow }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <ArrowUpFromLine className="h-4 w-4" />
                </div>
                <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="mb-4 flex-1 rounded-lg border border-orange-200 bg-orange-50/40 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-xs font-medium text-orange-700">Transformación — Insumo</span>
                        <p className="text-sm font-medium">→ {data.product_name}</p>
                        {data.notes && <p className="text-xs text-muted-foreground">{data.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-orange-700">{data.quantity} un.</p>
                        {data.transformation_cost != null && (
                            <p className="text-xs text-muted-foreground">Costo: {formatCurrency(data.transformation_cost)}</p>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(data.transformation_date)}</p>
            </div>
        </div>
    );
}

export function TransformResultCard({ data }: { data: LotTransformationRow }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <ArrowDownToLine className="h-4 w-4" />
                </div>
                <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="mb-4 flex-1 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-xs font-medium text-blue-700">Transformación — Resultado</span>
                        <p className="text-sm font-medium">← {data.product_name}</p>
                        {data.notes && <p className="text-xs text-muted-foreground">{data.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-blue-700">{data.quantity} un.</p>
                        {data.final_cost_total != null && (
                            <p className="text-xs text-muted-foreground">Costo total: {formatCurrency(data.final_cost_total)}</p>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(data.transformation_date)}</p>
            </div>
        </div>
    );
}
