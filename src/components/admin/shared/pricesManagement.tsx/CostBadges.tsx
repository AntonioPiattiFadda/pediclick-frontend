import { Badge } from '@/components/ui/badge';

const CostBadges = ({ finalCost }: {
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}) => {
    return (
        <div className="flex gap-4 flex-wrap text-sm">
            <Badge variant="secondary">
                Costo total: {finalCost.final_cost_total?.toFixed(2) ?? "--"}
            </Badge>
            <Badge variant="secondary">
                Costo por bulto: {finalCost.final_cost_per_bulk?.toFixed(2) ?? "--"}
            </Badge>
            <Badge variant="secondary">
                Costo por unidad: {finalCost.final_cost_per_unit?.toFixed(2) ?? "--"}
            </Badge>
        </div>
    )
}

export default CostBadges