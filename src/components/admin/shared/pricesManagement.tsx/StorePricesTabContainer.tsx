import { TabsContent } from '@/components/ui/tabs';
import { getProductPrices } from '@/service/prices';
import type { Store } from '@/types/stores';
import { useQuery } from '@tanstack/react-query';
import StorePricesTab from './StorePricesTab';

const StorePricesTabContainer = ({ key, productPresentationId, store, finalCost, disabled }: {
    productPresentationId: number;
    store: Store;
    key: string;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    disabled?: boolean;
}) => {

    const { data: productPrices = [], isLoading, isError } = useQuery({
        queryKey: ["prices", productPresentationId, store.store_id],
        queryFn: async () => {
            const response = await getProductPrices(productPresentationId, store.store_id);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productPresentationId,
    });

    if (isLoading) {
        return (
            <TabsContent key={key} value={store.store_id.toString()}>
                <div>Cargando precios para {store.store_name}...</div>
            </TabsContent>
        );
    }

    if (isError) {
        return (
            <TabsContent key={key} value={store.store_id.toString()}>
                <div>Error al cargar precios para {store.store_name}.</div>
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
        />
    )
}

export default StorePricesTabContainer