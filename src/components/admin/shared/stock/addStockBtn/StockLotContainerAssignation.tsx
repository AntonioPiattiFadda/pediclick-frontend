import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import { CreateLotContainer, LotContainerSelectorRoot, SelectLotContainer } from "../../selectors/LocationContainerSelector";

const StockLotContainerAssignation = ({
    lotContainersLocations,
    onChangeLotContainersLocation,
    store_id,
    stock_room_id,
}: {
    lotContainersLocations: LotContainersLocation[],
    onChangeLotContainersLocation: (nextLotContainersLocation: LotContainersLocation[]) => void,
    store_id?: number,
    stock_room_id?: number,
}) => {


    const handleUpdateLotContainersLocation = (quantity: number) => {
        const existingLCLIndex = lotContainersLocations?.findIndex(s =>
            store_id ? s.store_id === store_id : s.stock_room_id === stock_room_id
        ) ?? -1;
        let updatedLotContainersLocations: LotContainersLocation[] = [];

        if (existingLCLIndex >= 0) {
            updatedLotContainersLocations = [...(lotContainersLocations || [])];
            updatedLotContainersLocations[existingLCLIndex] = {
                ...updatedLotContainersLocations[existingLCLIndex],
                quantity: quantity,
            };
        } else {
            const newLotContainersLocation: LotContainersLocation = {
                lot_container_location_id: Date.now(),
                lot_id: null,
                lot_container_id: null,
                quantity: quantity,
                created_at: null,
                store_id: store_id || null,
                stock_room_id: stock_room_id || null,
                client_id: null,
                provider_id: null,
            };
            updatedLotContainersLocations = [...(lotContainersLocations || []), newLotContainersLocation];
        }
        onChangeLotContainersLocation(updatedLotContainersLocations);
    };

    const handleUpdateLotContainersLocationLotContainer = (lotContainerId: number | null, lotContainerName: string | null) => {
        const existingLCLIndex = lotContainersLocations?.findIndex(s =>
            store_id ? s.store_id === store_id : s.stock_room_id === stock_room_id
        ) ?? -1;
        let updatedLotContainersLocations: LotContainersLocation[] = [];

        if (existingLCLIndex >= 0) {
            updatedLotContainersLocations = [...(lotContainersLocations || [])];
            updatedLotContainersLocations[existingLCLIndex] = {
                ...updatedLotContainersLocations[existingLCLIndex],
                lot_container_id: lotContainerId,
                lot_container_name: lotContainerName,
            };
        } else {
            const newLotContainersLocation: LotContainersLocation = {
                lot_container_location_id: Date.now(),
                lot_id: null,
                lot_container_id: lotContainerId,
                quantity: 0,
                created_at: null,
                store_id: store_id || null,
                stock_room_id: stock_room_id || null,
                client_id: null,
                provider_id: null,
                lot_container_name: lotContainerName,

            };
            updatedLotContainersLocations = [...(lotContainersLocations || []), newLotContainersLocation];
        }
        onChangeLotContainersLocation(updatedLotContainersLocations);
    };

    const lotContainersLocation = store_id
        ? lotContainersLocations.find(l => l.store_id === store_id)
        : stock_room_id
            ? lotContainersLocations.find(l => l.stock_room_id === stock_room_id)
            : null;

    return (
        <>
            {lotContainersLocation && (
                <div className="flex flex-col gap-1 ml-auto">
                    <p>
                        {lotContainersLocation.lot_container_name}: {lotContainersLocation.quantity}
                    </p>

                </div>
            )}
            <Dialog>
                <form>
                    <DialogTrigger asChild>
                        <Button variant="outline">Vacíos</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Asignación de Vacíos</DialogTitle>
                            {/* <DialogDescription>
                            Make changes to your profile here. Click save when you&apos;re
                            done.
                        </DialogDescription> */}
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <LotContainerSelectorRoot
                                    value={{
                                        lot_container_id: lotContainersLocation?.lot_container_id || 0,
                                        lot_container_name: lotContainersLocation?.lot_container_name || '',
                                        lot_container_price: 0,
                                    }}
                                    onChange={(value) => {
                                        handleUpdateLotContainersLocationLotContainer(value?.lot_container_id || null, value?.lot_container_name || null);

                                    }}
                                >
                                    <SelectLotContainer />
                                    <CreateLotContainer />
                                </LotContainerSelectorRoot>
                            </div>
                            <div className="grid gap-3">
                                <Label >Cantidad</Label>
                                <Input
                                    value={lotContainersLocation?.quantity || 0}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        handleUpdateLotContainersLocation(Number(newValue));
                                    }}
                                />
                            </div>
                            {/* <div className="grid gap-3">
                            <Label htmlFor="username-1">Username</Label>
                            <Input id="username-1" name="username" defaultValue="@peduarte" />
                        </div> */}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Dialog >
        </>

    )
}

export default StockLotContainerAssignation

