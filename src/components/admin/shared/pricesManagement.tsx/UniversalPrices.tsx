

import { TabsContent } from '@/components/ui/tabs';
import { getProductPrices } from '@/service/prices';
import { useQuery } from '@tanstack/react-query';

const UniversalPrices = ({ productId }: {
    productId: number
}) => {

    const { data: productPrices = [], isLoading, isError } = useQuery({
        queryKey: ["prices", productId],
        queryFn: async () => {
            const response = await getProductPrices(productId, null);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productId,
    });

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    if (isError) {
        return <div>Error al cargar los precios.</div>;
    }

    console.log("Universal Product Prices:", productPrices);

    return (
        <TabsContent value={'all-stores'}>
            {productPrices.map((price) => (
                <div key={price.price_id} className="p-2 border-b last:border-0">
                    <div>Tipo de precio: {price.price_type}</div>
                    <div>Valor: {price.value}</div>
                    <div>Tipo de lógica: {price.logic_type}</div>
                </div>
            ))}

        </TabsContent>
    )
}

export default UniversalPrices