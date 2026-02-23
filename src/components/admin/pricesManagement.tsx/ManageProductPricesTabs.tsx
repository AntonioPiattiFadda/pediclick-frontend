import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocations } from "@/service/locations";
import type { Location } from "@/types/locations";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import CostBadges from "./CostBadges";
import StorePricesTabContainer from "./StorePricesTabContainer";
import UniversalPricesContainer from "./UniversalPricesContainer";

interface PricesDialogProps {
    productPresentationId: number;
    disabled?: boolean;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}

type TabActions = {
    save: (afterSave?: () => void) => void;
    discard: () => void;
};

export default function ManageProductPrices({
    productPresentationId,
    disabled = false,
    finalCost
}: PricesDialogProps) {
    const [open, setOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState("all-stores");
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [dirtyTabs, setDirtyTabs] = useState<Record<string, boolean>>({});
    const tabActionsRef = useRef<Record<string, TabActions>>({});

    const { data: stores = [], isLoading: isStoreLoading } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getLocations();
            return response.locations?.filter(loc => loc.type === "STORE") || [];
        },
    });

    const handleDirtyChange = (tabId: string, isDirty: boolean) => {
        setDirtyTabs(prev => ({ ...prev, [tabId]: isDirty }));
    };

    const handleRegisterActions = (tabId: string, save: (afterSave?: () => void) => void, discard: () => void) => {
        tabActionsRef.current[tabId] = { save, discard };
    };

    const handleTabChange = (newTab: string) => {
        if (dirtyTabs[currentTab]) {
            setPendingTab(newTab);
            setShowUnsavedDialog(true);
        } else {
            setCurrentTab(newTab);
        }
    };

    const handleSaveAndSwitch = () => {
        const actions = tabActionsRef.current[currentTab];
        if (!actions) return;
        actions.save(() => {
            setCurrentTab(pendingTab!);
            setPendingTab(null);
            setShowUnsavedDialog(false);
        });
    };

    const handleDiscardAndSwitch = () => {
        tabActionsRef.current[currentTab]?.discard();
        setCurrentTab(pendingTab!);
        setPendingTab(null);
        setShowUnsavedDialog(false);
    };

    if (isStoreLoading) {
        return (
            <Sheet open={false}>
                <SheetTrigger asChild>
                    <Button className="w-[150px]" disabled>Modificar precios</Button>
                </SheetTrigger>
            </Sheet>
        );
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
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
                        <CardHeader className="p-0 flex flex-row justify-between">
                            <CardTitle>Costos:</CardTitle>
                            <CostBadges finalCost={finalCost} />
                        </CardHeader>

                        <Badge variant="secondary" className="text-xs">
                            Los precios marcados como "universales" se aplican a todas las tiendas.
                            Si elegís una tienda específica, el precio solo afectará a esa tienda.
                        </Badge>

                        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="w-full mb-4">
                                <TabsTrigger value="all-stores">Universal</TabsTrigger>
                                {stores.map((store: Location) => (
                                    <TabsTrigger key={store.location_id} value={store.location_id.toString()}>
                                        {store.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <UniversalPricesContainer
                                onClose={() => setOpen(false)}
                                productPresentationId={productPresentationId}
                                finalCost={finalCost}
                                onDirtyChange={(isDirty) => handleDirtyChange("all-stores", isDirty)}
                                onRegisterActions={(save, discard) => handleRegisterActions("all-stores", save, discard)}
                            />

                            {stores.map((store: Location) => (
                                <StorePricesTabContainer
                                    key={store.location_id}
                                    productPresentationId={productPresentationId}
                                    store={store}
                                    finalCost={finalCost}
                                    disabled={disabled}
                                    onClose={() => setOpen(false)}
                                    onDirtyChange={(isDirty) => handleDirtyChange(store.location_id.toString(), isDirty)}
                                    onRegisterActions={(save, discard) => handleRegisterActions(store.location_id.toString(), save, discard)}
                                />
                            ))}
                        </Tabs>
                    </Card>

                    <SheetFooter className="mt-6" />
                </SheetContent>
            </Sheet>

            <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tenés cambios sin guardar en esta pestaña. ¿Qué querés hacer?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDiscardAndSwitch}>Descartar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveAndSwitch}>Guardar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
