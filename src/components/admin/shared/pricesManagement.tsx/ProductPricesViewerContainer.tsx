import { getAllProductPrices } from "@/service/prices";
import { getUserStores } from "@/service/stores";
import { useQuery } from "@tanstack/react-query";
import ProductPricesViewer from "./ProductPricesViewer";

const ProductPricesViewerContainer = ({ productId, finalCost }: {
    productId: number;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}) => {

    const {
        data: stores = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getUserStores();
            return response.stores;
        },
    });

    const {
        data: productPrices = [],
        isLoading: isPricesLoading,
        isError: isPricesError,
    } = useQuery({
        queryKey: ["prices", productId],
        queryFn: async () => {
            const response = await getAllProductPrices(productId);
            return response.productPrices;
        },
    });

    console.log("Stores in Container:", stores);
    console.log("Product Prices in Container:", productPrices);


    if (isLoading || isPricesLoading) {
        return <div>Loading...</div>;
    }

    if (isError || isPricesError) {
        return <div>Error loading stores.</div>;
    }

    return (
        <ProductPricesViewer
            productId={productId}
            stores={stores}
            productPrices={productPrices}
            finalCost={{
                final_cost_total: finalCost?.final_cost_total || null,
                final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
            }} />
    )
}

export default ProductPricesViewerContainer