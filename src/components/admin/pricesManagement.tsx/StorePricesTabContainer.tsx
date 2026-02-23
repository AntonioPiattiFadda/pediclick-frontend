import { TabsContent } from '@/components/ui/tabs';
import { getDisabledPrices, getProductPrices } from '@/service/prices';
import type { Location } from '@/types/locations';
import { useQuery } from '@tanstack/react-query';
import StorePricesTab from './StorePricesTab';

const StorePricesTabContainer = ({ key, productPresentationId, store, finalCost, disabled }: {
    productPresentationId: number;
    store: Location;
    key: number;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    disabled?: boolean;
}) => {

    const { data: localPrices = [], isLoading: isLocalLoading, isError: isLocalError } = useQuery({
        queryKey: ["prices", productPresentationId, store.location_id],
        queryFn: async () => {
            const response = await getProductPrices(productPresentationId, store.location_id);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productPresentationId,
    });

    const { data: universalPrices = [], isLoading: isUniversalLoading, isError: isUniversalError } = useQuery({
        queryKey: ["prices", productPresentationId, null],
        queryFn: async () => {
            const response = await getProductPrices(productPresentationId, null);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productPresentationId,
    });

    const { data: disabledPrices = [], isLoading: isDisabledLoading, isError: isDisabledError } = useQuery({
        queryKey: ["disabled_prices", productPresentationId, store.location_id],
        queryFn: async () => {
            const response = await getDisabledPrices(productPresentationId, store.location_id);
            return response.disabledPrices;
        },
        enabled: !!productPresentationId,
    });

    const isLoading = isLocalLoading || isUniversalLoading || isDisabledLoading;
    const isError = isLocalError || isUniversalError || isDisabledError;

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
            localPrices={localPrices}
            universalPrices={universalPrices}
            disabledPrices={disabledPrices}
        />
    );
};

export default StorePricesTabContainer;
