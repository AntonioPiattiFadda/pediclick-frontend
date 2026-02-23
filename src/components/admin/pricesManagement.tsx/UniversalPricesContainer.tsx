

import { getProductPrices } from '@/service/prices';
import { useQuery } from '@tanstack/react-query';
import UniversalPrices from './UniversalPrices';

const UniversalPricesContainer = ({ productPresentationId, finalCost, onClose, onDirtyChange, onRegisterActions }: {
    productPresentationId: number;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    onClose: () => void;
    onDirtyChange: (isDirty: boolean) => void;
    onRegisterActions: (save: (afterSave?: () => void) => void, discard: () => void) => void;
}) => {

    const locationId = null;

    const { data: productPrices = [], isLoading, isError } = useQuery({
        queryKey: ["prices", productPresentationId, locationId],
        queryFn: async () => {
            const response = await getProductPrices(productPresentationId, locationId);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productPresentationId,
    });



    if (isLoading) {
        return <div>Cargando...</div>;
    }

    if (isError) {
        return <div>Error al cargar los precios.</div>;
    }


    return (
        <UniversalPrices
            productPresentationId={productPresentationId}
            finalCost={finalCost}
            disabled={false}
            productPrices={productPrices}
            onClose={onClose}
            onDirtyChange={onDirtyChange}
            onRegisterActions={onRegisterActions}
        />
    )
}

export default UniversalPricesContainer