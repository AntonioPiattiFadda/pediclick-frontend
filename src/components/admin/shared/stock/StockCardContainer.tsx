import type { Stock } from '@/types/stocks';

const StockCardContainer = ({ stock }: {
    stock: Stock;
}) => {
    const locationName = stock.locations?.name || 'Sin ubicación';


    return (
        <div key={stock.stock_id} className="mb-1">
            {locationName}: {stock.quantity}
        </div>
    )
}

export default StockCardContainer