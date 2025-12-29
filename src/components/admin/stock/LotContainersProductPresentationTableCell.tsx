import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
// import type { LotContainersStock } from '@/types/lotContainersStock';
import type { Lot } from '@/types/lots';
import { useState } from 'react';
// import LocationCardContainer from './LocationCardContainer';
import { formatDate } from '@/utils';

// const LotContainersStockCardComponent = ({ lotContainerStock }: {
//     lotContainerStock?: LotContainersStock[];
// }) => {
//     return (lotContainerStock?.map((location) => {
//         return (<LocationCardContainer location={location} />

//         )
//     }))
// };

const LotContainersProductPresentationTableCell = ({ lots }: { lots: Lot[] }) => {
    const [showDetails, setShowDetails] = useState(false);

    const reducedLotContainersLocation = lots.reduce((accLot, lot) => {
        const stockTotals = lot.stock?.reduce((accStock, stock) => {
            const containersTotal = stock.lot_containers_stock?.reduce((accContainer, container) => {
                return accContainer + (container.quantity || 0);
            }, 0) || 0;

            return accStock + containersTotal;
        }, 0) || 0;

        return accLot + stockTotals;
    }, 0) || 0;


    if (!showDetails) {
        return (
            <div>
                <div className='flex gap-2 items-center mb-2'>
                    <Label>Detalles por lote</Label>
                    <Switch checked={showDetails} onCheckedChange={setShowDetails} />
                </div>
                <div className="mb-4">
                    <div className="font-semibold mb-2">Vacíos: {reducedLotContainersLocation}</div>
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
            {lots.map((lot) => {
                const lotContainerStock = lot.stock?.flatMap(stock => stock.lot_containers_stock)
                console.log(lotContainerStock)
                return <div key={lot.lot_id} className="mb-2">
                    <div className="font-semibold mb-2">Lote: {formatDate(lot.created_at)}</div>
                    {/* <LotContainersStockCardComponent
                        lotContainerStock={lotContainerStock}
                    /> */}
                </div>
            })}
        </div>
    );
}

export default LotContainersProductPresentationTableCell