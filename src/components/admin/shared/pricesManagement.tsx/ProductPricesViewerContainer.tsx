import { getAllProductPresentationPrices } from "@/service/prices";
import { getUserStores } from "@/service/stores";
import { useQuery } from "@tanstack/react-query";
import ProductPricesViewer from "./ProductPricesViewer";

const ProductPricesViewerContainer = ({ productPresentationId, finalCost }: {
    productPresentationId: number;
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

    // const {
    //     data: productPrices = [],
    //     isLoading: isPricesLoading,
    //     isError: isPricesError,
    // } = useQuery({
    //     queryKey: ["prices", productId],
    //     queryFn: async () => {
    //         const response = await getAllProductPrices(productId);
    //         return response.productPrices;
    //     },
    // });

    const {
        data: productPresentationPrices = [],
        isLoading: isPresentationPricesLoading,
        isError: isPresentationPricesError,
    } = useQuery({
        queryKey: ["prices", productPresentationId],
        queryFn: async () => {
            const response = await getAllProductPresentationPrices(productPresentationId);
            return response.productPresentationPrices;
        },
    });

    console.log("productPresentationPrices...", productPresentationPrices);


    // console.log("Stores in Container:", stores);
    // console.log("Product Prices in Container:", productPrices);


    if (isLoading || isPresentationPricesLoading) {
        return <div>Loading...</div>;
    }

    if (isError || isPresentationPricesError) {
        return <div>Error loading stores.</div>;
    }

    return (
        <ProductPricesViewer
            productPresentationId={productPresentationId}
            stores={stores}
            productPrices={productPresentationPrices}
            finalCost={{
                final_cost_total: finalCost?.final_cost_total || null,
                final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
            }} />
    )
}

export default ProductPricesViewerContainer