import { TabsContent } from '@/components/ui/tabs';
import { getProductPrices } from '@/service/prices';
import { useQuery } from '@tanstack/react-query';
import StorePricesTab from './StorePricesTab';
import type { Location } from '@/types/locations';

const StorePricesTabContainer = ({ key, productPresentationId, store, finalCost, disabled, onClose, onDirtyChange, onRegisterActions }: {
    productPresentationId: number;
    store: Location;
    key: number;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    disabled?: boolean;
    onClose: () => void;
    onDirtyChange: (isDirty: boolean) => void;
    onRegisterActions: (save: (afterSave?: () => void) => void, discard: () => void) => void;
}) => {

    const { data: productPrices = [], isLoading, isError } = useQuery({
        queryKey: ["prices", productPresentationId, store.location_id],
        queryFn: async () => {
            const response = await getProductPrices(productPresentationId, store.location_id);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productPresentationId,
    });

    if (isLoading) {
        return (
            <TabsContent key={key} value={store.location_id.toString()}>
                <div>Cargando precios para {store.name}...</div>
            </TabsContent>
        );
    }

    if (isError) {
        return (
            <TabsContent key={key} value={store.location_id.toString()}>
                <div>Error al cargar precios para {store.name}.</div>
            </TabsContent>
        );
    }

    return (
        <StorePricesTab
            key={key}
            productPresentationId={productPresentationId}
            store={store}
            finalCost={finalCost}
            disabled={disabled}
            productPrices={productPrices}
            onClose={onClose}
            onDirtyChange={onDirtyChange}
            onRegisterActions={onRegisterActions}
        />
    )
}

export default StorePricesTabContainer