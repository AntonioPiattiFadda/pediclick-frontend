import type { LotContainersStock } from '@/types/lotContainersStock';

const LocationCardContainer = ({ location }: {
    location: LotContainersStock;
}) => {


    return (
        <div key={location.lot_container_stock_id} className="mb-1">
            {location.location_name || 'No asignado'}
        </div>
    )
}

export default LocationCardContainer