import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Lot } from '@/types/lots';
import type { Stock } from '@/types/stocks';
import { useState } from 'react';
import StockCardContainer from './StockCardContainer';
import { formatDate } from '@/utils';
import SalesHistory from './salesHistory';
import { StockData } from './StockData';

const StockCardComponent = ({ stock, productPresentationId }: {
    stock?: Stock[];
    productPresentationId: number;
}) => {
    return (stock?.map((stock) => {
        return (
            <StockCardContainer key={stock.stock_id} stock={stock} productPresentationId={productPresentationId} />
        )
    }))
};

const LotsAndStockProductPresentationTableCell = ({ lots, productPresentationId }: { lots: (Lot & { product_presentation_id: number })[], productPresentationId: number }) => {

    const [showDetails, setShowDetails] = useState(false);

    const reducedStock = lots.reduce((acc, lot) => {
        const lotStock = lot.stock?.reduce((sAcc: number, stockItem: Stock) => {
            return sAcc + (stockItem.quantity || 0);
        }, 0) || 0;
        return acc + lotStock;
    }, 0) || 0;

    const reducedReservedForTransferring = lots.reduce((acc, lot) => {
        const lotStock = lot.stock?.reduce((sAcc: number, stockItem: Stock) => {
            return sAcc + (stockItem.reserved_for_transferring_quantity || 0);
        }, 0) || 0;
        return acc + lotStock;
    }, 0) || 0;

    const reducedReservedForSelling = lots.reduce((acc, lot) => {
        const lotStock = lot.stock?.reduce((sAcc: number, stockItem: Stock) => {
            return sAcc + (stockItem.reserved_for_selling_quantity || 0);
        }, 0) || 0;
        return acc + lotStock;
    }, 0) || 0;


    if (!showDetails) {
        return (
            <div>
                <div className='flex gap-3 items-center mb-2'>
                    <Label>Detalles por lote</Label>
                    <Switch checked={showDetails} onCheckedChange={setShowDetails} />
                </div>
                <div className="mb-2">
                    <div className="font-semibold flex flex-row gap-1">Cantidad: {reducedStock || 0} / {reducedReservedForTransferring || 0} / {reducedReservedForSelling || 0}
                        <StockData stock={{
                            quantity: reducedStock,
                            reserved_for_selling_quantity: reducedReservedForSelling,
                            reserved_for_transferring_quantity: reducedReservedForTransferring
                        }} />
                    </div>

                </div>

            </div>
        );
    }

    return (
        <div>
            <div className='flex gap-2 mb-2'>
                <Label>Detalles por lote</Label>
                <Switch checked={showDetails} onCheckedChange={setShowDetails} />
            </div>
            {lots.map((lot) => (

                <div key={lot.lot_id} className="mb-2">
                    <div className="font-semibold mb-2 flex gap-2 items-center">Lote:
                        <span>
                            {formatDate(lot.created_at)}
                        </span>
                        <SalesHistory lotId={lot.lot_id || null} />
                    </div>
                    <StockCardComponent stock={lot.stock} productPresentationId={productPresentationId} />
                </div>
            ))}
        </div>
    );
}

export default LotsAndStockProductPresentationTableCell