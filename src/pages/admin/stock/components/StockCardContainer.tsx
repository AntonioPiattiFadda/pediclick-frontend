import { UseLocationsContext } from '@/contexts/LocationsContext';
import type { Stock } from '@/types/stocks';
import AssignStock from './AssignStock';
import { StockData } from './StockData';
import DisposeWaste from '@/components/admin/stock/DisposeWaste';

const StockCardContainer = ({ stock, productPresentationId }: {
    stock: Stock;
    productPresentationId: number;
}) => {

    const locations = UseLocationsContext().locations;

    const locationName = locations.find(location => location.location_id === stock.location_id)?.name || 'Sin ubicación';

    const isUnassignedStock = !stock.location_id;
    return (
        <div key={stock.stock_id} className="mb-1 flex gap-2 items-center">
            <span className='flex flex-row gap-1'>
                {locationName}: {stock.quantity || 0} / {stock.reserved_for_selling_quantity || 0} / {stock.reserved_for_transferring_quantity || 0} <StockData stock={stock} />
            </span>
            {isUnassignedStock && (
                <AssignStock stock={stock} productPresentationId={productPresentationId} />
            )}
            <DisposeWaste lotId={stock.lot_id} stockId={stock.stock_id} />
        </div>
    )
}

export default StockCardContainer