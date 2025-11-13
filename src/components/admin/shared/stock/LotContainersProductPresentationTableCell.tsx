import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { LotContainersLocation } from '@/types/lotContainersLocation';
import type { Lot } from '@/types/lots';
import { useState } from 'react';
import LocationCardContainer from './LocationCardContainer';

const LotContainersLocationCardComponent = ({ lotContainerLocation }: {
    lotContainerLocation?: LotContainersLocation[];
}) => {
    return (lotContainerLocation?.map((location) => {
        return (<LocationCardContainer location={location} />

        )
    }))
};

const LotContainersProductPresentationTableCell = ({ lots }: { lots: Lot[] }) => {
    const [showDetails, setShowDetails] = useState(false);

    const reducedLotContainersLocation = lots.reduce((acc, lot) => {
        const lotContainers = lot.lot_containers_location?.reduce((cAcc: number, container) => {
            return cAcc + (container.quantity || 0);
        }, 0) || 0;
        return acc + lotContainers;
    }, 0) || 0;

    if (!showDetails) {
        return (
            <div>
                <div className='flex gap-2'>
                    <Label>Detalles por lote</Label>
                    <Switch checked={showDetails} onCheckedChange={setShowDetails} className="mb-4" />
                </div>
                <div className="mb-4">
                    <div className="font-semibold mb-2">Todos los Vacíos: {reducedLotContainersLocation}</div>

                </div>

            </div>
        );
    }

    return (
        <div>
            <div className='flex gap-2'>
                <Label>Detalles por lote</Label>
                <Switch checked={showDetails} onCheckedChange={setShowDetails} className="mb-4" />
            </div>
            {lots.map((lot) => (
                <div key={lot.lot_id} className="mb-4">
                    <div className="font-semibold mb-2">Lote Número: {lot.lot_id}</div>
                    <LotContainersLocationCardComponent lotContainerLocation={lot.lot_containers_location} />
                </div>
            ))}
        </div>
    );
}

export default LotContainersProductPresentationTableCell