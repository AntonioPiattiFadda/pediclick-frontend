import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Lot } from '@/types/lots';
import type { Stock } from '@/types/stocks';
import { useState } from 'react';
import StockCardContainer from './StockCardContainer';

const StockCardComponent = ({ stock }: {
    stock?: Stock[];
}) => {
    return (stock?.map((stock) => {
        return (<StockCardContainer stock={stock} />

        )
    }))
};

const LotsAndStockProductPresentationTableCell = ({ lots }: { lots: Lot[] }) => {
    const [showDetails, setShowDetails] = useState(false);

    const reducedStock = lots.reduce((acc, lot) => {
        const lotStock = lot.stock?.reduce((sAcc: number, stockItem: Stock) => {
            return sAcc + (stockItem.current_quantity || 0);
        }, 0) || 0;
        return acc + lotStock;
    }, 0) || 0;


    if (!showDetails) {
        return (
            <div>
                <div className='flex gap-2 items-center'>
                    <Label>Detalles por lote</Label>
                    <Switch checked={showDetails} onCheckedChange={setShowDetails} />
                </div>
                <div className="mb-4">
                    <div className="font-semibold mb-2">Todos los stock: {reducedStock}</div>

                </div>

            </div>
        );
    }

    return (
        <div>
            <div className='flex gap-2'>
                <Label>Detalles por lote</Label>
                <Switch checked={showDetails} onCheckedChange={setShowDetails} />
            </div>
            {lots.map((lot) => (
                <div key={lot.lot_id} className="mb-4">
                    <div className="font-semibold mb-2">Lote Número: {lot.lot_id}</div>
                    <StockCardComponent stock={lot.stock} />
                </div>
            ))}
        </div>
    );
}

export default LotsAndStockProductPresentationTableCell