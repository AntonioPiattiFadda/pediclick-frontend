import { UseLocationsContext } from '@/contexts/LocationsContext';
import type { Stock } from '@/types/stocks';
import AssignStock from './AssignStock';

const StockCardContainer = ({ stock }: {
    stock: Stock;
}) => {

    const locations = UseLocationsContext().locations;

    const locationName = locations.find(location => location.location_id === stock.location_id)?.name || 'Sin ubicación';

    const isUnassignedStock = !stock.location_id;

    return (
        <div key={stock.stock_id} className="mb-1 flex gap-2 items-center">
            <span>
                {locationName}: {stock.quantity}
            </span>
            {isUnassignedStock && (
                <AssignStock stock={stock} />
            )}
        </div>
    )
}

export default StockCardContainer