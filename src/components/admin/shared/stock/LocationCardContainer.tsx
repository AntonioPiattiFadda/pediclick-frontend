import { getStockRoomName } from '@/service/stockRooms';
import { getStoreName } from '@/service/stores';
import type { LotContainersLocation } from '@/types/lotContainersLocation';
import { useQuery } from '@tanstack/react-query';

const LocationCardContainer = ({ location }: {
    location: LotContainersLocation;
}) => {

    const locationType = location.store_id ? 'STORE' : 'STOCK_ROOM';

    const { data: locationName, isLoading, isError } = useQuery({
        queryKey: ["location-name", 1],
        queryFn: async () => {
            const response = locationType === 'STORE' ? await getStoreName(location.store_id) : await getStockRoomName(location.stock_room_id);
            return response
        },
    });

    return (
        <div key={location.lot_container_location_id} className="mb-1">
            Cantidad: {location.quantity}
            Ubicacion: {isLoading ? 'Cargando...' : isError ? 'Error al cargar' : locationName || 'No asignado'}
        </div>
    )
}

export default LocationCardContainer