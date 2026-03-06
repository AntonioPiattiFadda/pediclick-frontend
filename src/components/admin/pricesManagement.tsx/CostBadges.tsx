import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/prices';

const CostBadges = ({ finalCost }: {
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}) => {
    const costAreEqual = finalCost.final_cost_per_unit === finalCost.final_cost_per_bulk
    return (
        <div className="flex gap-4 flex-wrap text-sm">
            {finalCost.final_cost_total && (
                <Badge variant="secondary">
                    Costo total: {formatCurrency(finalCost.final_cost_total || 0)}
                </Badge>
            )}
            {!costAreEqual && (
                <Badge variant="secondary">
                    Costo por bulto: {formatCurrency(finalCost.final_cost_per_bulk || 0)}
                </Badge>
            )}
            <Badge variant="secondary">
                Costo por unidad: {formatCurrency(finalCost.final_cost_per_unit || 0)}
            </Badge>
        </div>
    )
}

export default CostBadges