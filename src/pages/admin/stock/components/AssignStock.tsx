import { LocationSelectorRoot, SelectLocation } from "@/components/admin/selectors/locationSelector";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { assignStock } from "@/service/stockMovement";
import type { Location } from "@/types/locations";
import type { StockMovement } from "@/types/stockMovements";
import type { Stock } from "@/types/stocks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Link } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const AssignStock = ({
    stock,
    productPresentationId,
}
    : {
        stock: Stock;
        productPresentationId: number;
    }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();


    const initialStockQty = stock.quantity;

    const [stockMovement, setStockMovement] = useState<Omit<StockMovement, "stock_movement_id" | "should_notify_owner" | "lot_containers_to_move" | "created_at" | 'created_by'>>({
        stock_id: stock.stock_id,
        lot_id: stock.lot_id,
        movement_type: "TRANSFER",
        quantity: stock.quantity,
        qty_in_base_units: null,
        from_location_id: null,
        to_location_id: null,
        product_presentation_id: productPresentationId,

    });

    const [toLocation, setToLocation] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null);

    const assignStockMutation = useMutation({
        mutationFn: async () => {
            if (!toLocation) {
                throw new Error("Debe seleccionar una ubicación de destino");
            }
            if (!stockMovement.quantity || stockMovement.quantity <= 0) {
                throw new Error("La cantidad debe ser mayor a cero");
            }
            if (stockMovement.quantity > initialStockQty) {
                throw new Error("La cantidad a asignar no puede ser mayor a la cantidad disponible en stock");
            }

            const adaptedStockMovement = {
                ...stockMovement,
                to_location_id: toLocation?.location_id || null,
            }

            const fromStockData = {
                stock_id: stock.stock_id,
            }

            return await assignStock(fromStockData, adaptedStockMovement);
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ["products"],
            });
            toast.success("Stock asignado correctamente");
            setOpen(false);
        },
        onError: (error) => {
            const errorMessage =
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message?: unknown }).message)
                    : "Error desconocido";
            toast.error("Error: " + errorMessage);
        },
    });


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <form>
                <DialogTrigger asChild>
                    <Button size={'icon'} variant={'ghost'}><Link /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Asignar</DialogTitle>
                        {/* <DialogDescription>
                            Asignar stock a una ubicaci&oacute;n
                        </DialogDescription> */}
                        <DialogDescription className="text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" /> La asignacion directa compensara sobreventa del mismo lote automaticamente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label >Cantidad</Label>
                            <Input
                                value={stockMovement.quantity ?? ""}
                                onChange={e => setStockMovement({ ...stockMovement, quantity: Number(e.target.value) })} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Ubicación Destino:</Label>
                            <LocationSelectorRoot
                                // disabled={updateTransferOrderMutation.isLoading || isTransferring || isReadOnly}
                                // omitId={transferOrder.from_location_id}
                                value={toLocation}
                                onChange={setToLocation}>
                                <SelectLocation />
                                {/* <CreateLocation /> */}
                            </LocationSelectorRoot>
                        </div>
                    </div>
                    <DialogFooter className="grid grid-cols-3">
                        {/* <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose> */}
                        <Button className="col-start-3" type="submit" onClick={() => {
                            assignStockMutation.mutate()
                        }}>{assignStockMutation.isLoading ? <Spinner /> : "Asignar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}

export default AssignStock
