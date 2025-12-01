


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CostBadges from "./CostBadges";
import StorePricesTabContainer from "./StorePricesTabContainer";
import UniversalPricesContainer from "./UniversalPricesContainer";
import { getLocations } from "@/service/locations";
import type { Location } from "@/types/locations";

interface PricesDialogProps {
    productPresentationId: number;
    disabled?: boolean;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}

export default function ManageProductPrices({
    productPresentationId,
    disabled = false,
    finalCost
}: PricesDialogProps) {
    const [open, setOpen] = useState(false);

    const { data: stores = [], isLoading: isStoreLoading } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getLocations();
            console.log("Locations response:", response);
            return response.locations?.filter(loc => loc.type === "STORE") || [];
        },
    });

    console.log("Stores loaded for prices management:", stores);



    if (isStoreLoading) {
        return (
            <Card className="p-0 border-none shadow-none">
                <CardHeader className="p-0 flex flex-row justify-between mb-2" >
                    <CardTitle>Costos:</CardTitle>
                    <CostBadges finalCost={finalCost} />
                </CardHeader >
                <Spinner />
            </Card>
        );
    }

    return (<Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
            <Button className="w-[150px]">Modificar precios</Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[1040px] max-h-screen overflow-y-auto" side="right">
            <SheetHeader>
                <SheetTitle>Modificar precios</SheetTitle>
                <SheetDescription>
                    Esta edición afectará a todos los lotes de este producto, incluidos los creados anteriormente.
                </SheetDescription>
            </SheetHeader>


            <Card className="p-0 border-none shadow-none mt-2">
                <CardHeader className="p-0 flex flex-row justify-between" >
                    <CardTitle>Costos:</CardTitle>
                    <CostBadges finalCost={finalCost} />
                </CardHeader >

                <Badge variant="secondary" className="text-xs">
                    Los precios marcados como “universales” se aplican a todas las tiendas.
                    Si elegís una tienda específica, el precio solo afectará a esa tienda.
                </Badge>

                <Tabs defaultValue="all-stores" className="w-full">
                    <TabsList className="w-full mb-4">

                        <TabsTrigger value="all-stores">
                            Universal
                        </TabsTrigger>

                        {stores.map((store: Location) => (
                            <TabsTrigger key={store.location_id} value={store.location_id.toString()}>
                                {store.name}
                            </TabsTrigger>
                        ))}

                    </TabsList>

                    <UniversalPricesContainer productPresentationId={productPresentationId} finalCost={finalCost} />

                    {stores.map((store: Location) => (
                        <StorePricesTabContainer key={store.location_id} productPresentationId={productPresentationId} store={store} finalCost={finalCost} disabled={disabled} />
                    ))}


                </Tabs>
            </Card>


            <SheetFooter className="mt-6">
                {/* <SheetClose asChild>
                        <Button variant="outline" disabled={isSaving}>Cancelar</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={isSaving || !canEdit}>
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button> */}
            </SheetFooter>
        </SheetContent>
    </Sheet>




    )


}
