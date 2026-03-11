import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocations } from "@/service/locations";
import { getLastLotCosts } from "@/service/lots";
import type { Location } from "@/types/locations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import CostBadges from "./CostBadges";
import StorePricesTabContainer from "./StorePricesTabContainer";
import UniversalPricesContainer from "./UniversalPricesContainer";

interface PricesDialogProps {
    productPresentationId: number | null;
    disabled?: boolean;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    needsCostFetch: boolean;
    bulkQuantityEquivalence?: number | null;
    sellUnit?: 'BY_UNIT' | 'BY_WEIGHT' | null;
    presentationName?: string | null;
    mode?: 'sheet' | 'inline';
}

export default function ManageProductPrices({
    productPresentationId,
    disabled = false,
    finalCost,
    needsCostFetch = false,
    bulkQuantityEquivalence = null,
    sellUnit = null,
    presentationName = null,
    mode = 'sheet',
}: PricesDialogProps) {

    console.log("Final cost received in ManageProductPrices:", finalCost, sellUnit, bulkQuantityEquivalence, presentationName);

    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState("all-stores");

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ["prices", productPresentationId] });
        queryClient.invalidateQueries({ queryKey: ["disabled_prices", productPresentationId] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTab]);

    console.log("Needs cost fetch:", needsCostFetch);

    const allCostsNull = !finalCost?.final_cost_total && !finalCost?.final_cost_per_unit && !finalCost?.final_cost_per_bulk;
    const shouldFetch = needsCostFetch || allCostsNull;

    const { data: fetchedCosts, isLoading: isCostLoading, refetch: refetchCosts, isSuccess: isCostSuccess } = useQuery({
        queryKey: ["last_lot_costs", productPresentationId],
        queryFn: () => getLastLotCosts(productPresentationId!),
        enabled: false,
    });

    useEffect(() => {
        if (open && shouldFetch && productPresentationId) {
            refetchCosts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const resolvedCost = {
        final_cost_total: (shouldFetch ? null : finalCost?.final_cost_total) ?? null,
        final_cost_per_unit: (shouldFetch && fetchedCosts ? fetchedCosts.final_cost_per_unit : finalCost?.final_cost_per_unit) ?? null,
        final_cost_per_bulk: (shouldFetch ? null : finalCost?.final_cost_per_bulk) ?? null,
    };

    const { data: stores = [], isLoading: isStoreLoading } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getLocations();
            return response.locations?.filter(loc => loc.type === "STORE") || [];
        },
    });

    if (!productPresentationId) return null;

    if (isStoreLoading) {
        if (mode === 'inline') return <div>Cargando tiendas...</div>;
        return (
            <Sheet open={false}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" disabled><DollarSign className="w-4 h-4" /></Button>
                </SheetTrigger>
            </Sheet>
        );
    }

    const pricesContent = (
        <Card className="p-0 border-none shadow-none mt-2">
            <CardHeader className="p-0 flex flex-row justify-between">
                <CardTitle>Costos (Último lote registrado con costos):</CardTitle>
                {isCostLoading && shouldFetch ? <div>Cargando costos...</div> : <CostBadges finalCost={resolvedCost} />}
            </CardHeader>

            <Badge variant="secondary" className="text-xs">
                Los precios marcados como "universales" se aplican a todas las tiendas.
                Si elegís una tienda específica, el precio solo afectará a esa tienda.
            </Badge>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="w-full mb-4">
                    <TabsTrigger value="all-stores">Universal</TabsTrigger>
                    {stores.map((store: Location) => (
                        <TabsTrigger key={store.location_id} value={store.location_id.toString()}>
                            {store.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <UniversalPricesContainer
                    productPresentationId={productPresentationId}
                    finalCost={resolvedCost}
                    bulkQuantityEquivalence={bulkQuantityEquivalence}
                    sellUnit={sellUnit}
                />

                {stores.map((store: Location) => (
                    <StorePricesTabContainer
                        key={store.location_id}
                        productPresentationId={productPresentationId}
                        store={store}
                        finalCost={resolvedCost}
                        disabled={disabled}
                        bulkQuantityEquivalence={bulkQuantityEquivalence}
                        sellUnit={sellUnit}
                    />
                ))}
            </Tabs>
        </Card>
    );

    if (mode === 'inline') {
        return pricesContent;
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon"><DollarSign className="w-4 h-4" /></Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[1240px] max-h-screen overflow-y-auto" side="right">
                <SheetHeader>
                    <SheetTitle>Modificar precios{presentationName ? ` — ${presentationName}` : ''}</SheetTitle>
                    <SheetDescription>
                        Esta edición afectará a todos los lotes de este producto, incluidos los creados anteriormente.
                    </SheetDescription>
                    <SheetDescription>
                        {isCostSuccess && ('Costos del ultimo lote registrado')}
                        {finalCost?.final_cost_per_bulk && ('Costos del lote que estamos agregando')}
                    </SheetDescription>
                    <SheetDescription>
                        {sellUnit}, {bulkQuantityEquivalence}, {presentationName}
                    </SheetDescription>
                </SheetHeader>
                {pricesContent}
                <SheetFooter className="mt-6" />
            </SheetContent>
        </Sheet>
    );
}
