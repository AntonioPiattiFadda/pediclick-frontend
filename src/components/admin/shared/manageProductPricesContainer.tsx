import { getProductPrices } from "@/service/prices";
import { getUserStores } from "@/service/stores";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ManageProductPrices from "./manageProductPrices";
import { useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PricesDialogProps {
    productId: number;
    disabled?: boolean;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}

export default function ManageProductPricesContainer({
    productId,
    disabled = false,
    finalCost
}: PricesDialogProps) {

    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const prevSelectedStoreId = useRef<number | null>(null);
    // TODO: Obtener la tienda seleccionada desde el contexto o estado global si es necesario
    console.log("Selected Store ID:", selectedStoreId);
    const queryClient = useQueryClient();

    const handleSelectStore = (storeId: number | null) => {
        console.log("Store selected:", storeId);
        queryClient.invalidateQueries({ queryKey: ["prices", productId, prevSelectedStoreId.current] });
        setSelectedStoreId(storeId);
        prevSelectedStoreId.current = storeId;

    }

    const { data: productPrices = [], isLoading } = useQuery({
        queryKey: ["prices", productId, selectedStoreId],
        queryFn: async () => {
            const response = await getProductPrices(productId, selectedStoreId);
            return response.productPrices;
        },
        staleTime: Infinity,
        cacheTime: 0,
        enabled: !!productId,
    });

    console.log("Selected Store ID:", productPrices);

    const { data: stores = [], isLoading: isStoreLoading } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getUserStores();
            return response.stores;
        },
    });

    if (isLoading || isStoreLoading) {
        return (
            <Card className="p-0 border-none shadow-none">
                <CardContent className="p-0 border-none" >
                    <CardHeader className="p-0 flex flex-row justify-between mb-2" >
                        <CardTitle>Precios del lote </CardTitle>

                        <div className="flex gap-2">

                            <div className="flex gap-1">
                                <Label>Costo total:</Label>
                                <Badge variant={'secondary'}>{finalCost?.final_cost_total || '--'}</Badge>
                            </div>

                            <div className="flex gap-1">
                                <Label>Costo por bulto:</Label>
                                <Badge variant={'secondary'}>{finalCost?.final_cost_per_bulk || '--'}</Badge>
                            </div>

                            <div className="flex gap-1">
                                <Label>Costo por unidad:</Label>
                                <Badge variant={'secondary'}>{finalCost?.final_cost_per_unit || '--'}</Badge>
                            </div>


                        </div>
                    </CardHeader >
                    <Tabs>
                        <TabsList className="grid grid-cols-2 w-full mb-4">
                            <TabsTrigger value="MINOR">Minorista</TabsTrigger>
                            <TabsTrigger value="MAYOR">Mayorista</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Skeleton className="h-64 w-full rounded-md" />
                </CardContent>
            </Card>
        );
    }

    return (
        <ManageProductPrices
            productId={productId}
            disabled={disabled}
            finalCost={finalCost}
            productPrices={productPrices}
            stores={stores}
            selectedStoreId={selectedStoreId}
            onSelectStore={(storeId) => {
                handleSelectStore(storeId);

            }}
        />
    );
}
