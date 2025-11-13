import { getStockRoomName } from '@/service/stockRooms';
import { getStoreName } from '@/service/stores';
import type { Stock } from '@/types/stocks';
import { useQuery } from '@tanstack/react-query';

const StockCardContainer = ({ stock }: {
    stock: Stock;
}) => {

    const { data: locationName, isLoading, isError } = useQuery({
        queryKey: ["location-name", stock.stock_type === 'STORE' ? stock.stock_id : stock.stock_room_id],
        queryFn: async () => {
            const response = stock.stock_type === 'STORE' ? await getStoreName(stock.store_id) : await getStockRoomName(stock.stock_room_id);
            return response
        },
    });

    return (
        <div key={stock.stock_id} className="mb-1">
            Cantidad: {stock.current_quantity}
            Ubicacion: {isLoading ? 'Cargando...' : isError ? 'Error al cargar' : locationName || 'No asignado'}
        </div>
    )
}

export default StockCardContainer