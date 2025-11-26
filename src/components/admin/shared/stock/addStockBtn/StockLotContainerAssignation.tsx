import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import { PlusIcon, TrashIcon } from "lucide-react";
import { LotContainerSelectorRoot, SelectLotContainer } from "../../selectors/LocationContainerSelector";
import toast from "react-hot-toast";

const StockLotContainerAssignation = ({
    lotContainersLocations,
    onChangeLotContainersLocation,
    store_id,
    stock_room_id,
    remainingLotContainersToAssign
}: {
    lotContainersLocations: LotContainersLocation[],
    onChangeLotContainersLocation: (nextLotContainersLocation: LotContainersLocation[]) => void,
    store_id?: number,
    stock_room_id?: number,
    remainingLotContainersToAssign?: number,
}) => {

    const handleUpdateLotContainersLocation = (lotContainerLocationId: number, quantity: number) => {
        if (remainingLotContainersToAssign !== undefined && quantity > remainingLotContainersToAssign + (lotContainersLocations.find(lcl => lcl.lot_container_location_id === lotContainerLocationId)?.quantity || 0)) {
            toast("La cantidad asignada de vacíos no puede exceder el total disponible");
            return;
        }
        const existingLCLIndex = lotContainersLocations?.findIndex(s =>
            s.lot_container_location_id === lotContainerLocationId
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
                lot_container_id: null,
                quantity: quantity,
                created_at: null,
                store_id: store_id || null,
                stock_room_id: stock_room_id || null,
                client_id: null,
                provider_id: null,
                lot_container_status: 'COMPLETED',
            };
            updatedLotContainersLocations = [...(lotContainersLocations || []), newLotContainersLocation];
        }
        onChangeLotContainersLocation(updatedLotContainersLocations);
    };

    const handleAddNewElement = () => {
        const newLotContainersLocation: LotContainersLocation = {
            lot_container_location_id: Date.now(),
            lot_container_id: null,
            quantity: 0,
            created_at: null,
            store_id: store_id || null,
            stock_room_id: stock_room_id || null,
            client_id: null,
            provider_id: null,
            lot_container_status: 'COMPLETED',
        };
        const updatedLotContainersLocations = [...(lotContainersLocations || []), newLotContainersLocation];

        onChangeLotContainersLocation(updatedLotContainersLocations);
    };

    const handleDeleteElement = (lotContainerLocationId: number) => {
        const updatedLotContainersLocations = lotContainersLocations.filter(lcl => lcl.lot_container_location_id !== lotContainerLocationId);
        onChangeLotContainersLocation(updatedLotContainersLocations);
    }

    const handleUpdateLotContainersLocationLotContainer = (lotContainerLocationId: number, lotContainerId: number | null, lotContainerName: string | null) => {
        const existingLCLIndex = lotContainersLocations?.findIndex(s =>
            s.lot_container_location_id === lotContainerLocationId
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
                lot_container_id: lotContainerId,
                quantity: 0,
                created_at: null,
                store_id: store_id || null,
                stock_room_id: stock_room_id || null,
                client_id: null,
                provider_id: null,
                lot_container_name: lotContainerName,
                lot_container_status: 'COMPLETED',

            };
            updatedLotContainersLocations = [...(lotContainersLocations || []), newLotContainersLocation];
        }
        onChangeLotContainersLocation(updatedLotContainersLocations);
    };


    console.log("lotContainersLocations", lotContainersLocations);

    const locationLotContainersLocations = store_id
        ? lotContainersLocations.filter(l => l.store_id === store_id)
        : stock_room_id
            ? lotContainersLocations.filter(l => l.stock_room_id === stock_room_id)
            : null;

    console.log("locationLotContainersLocations", locationLotContainersLocations);

    return (
        <>
            <div className="flex flex-col gap-1 ml-auto mt-4">
                {locationLotContainersLocations && locationLotContainersLocations.length > 0 && (
                    locationLotContainersLocations.map((lcl) => (
                        <div key={lcl.lot_container_location_id} className="flex gap-2">
                            <div className="flex flex-col gap-1">
                                <Label >Vacío</Label>
                                <LotContainerSelectorRoot
                                    value={{
                                        lot_container_id: lcl?.lot_container_id || 0,
                                        lot_container_name: lcl?.lot_container_name || '',
                                        lot_container_price: 0,
                                    }}
                                    onChange={(value) => {
                                        handleUpdateLotContainersLocationLotContainer(lcl.lot_container_location_id, value?.lot_container_id || null, value?.lot_container_name || null);

                                    }}
                                >
                                    <SelectLotContainer />
                                    {/* <CreateLotContainer /> */}
                                </LotContainerSelectorRoot>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label >Cantidad de vacíos</Label>
                                <Input
                                    value={lcl?.quantity || 0}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        handleUpdateLotContainersLocation(lcl.lot_container_location_id, Number(newValue));
                                    }}
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    handleDeleteElement(lcl.lot_container_location_id);
                                }}
                                size={'icon'}
                                variant={'destructive'}
                                className="mt-auto mb-1"
                            >
                                <TrashIcon /></Button>
                        </div>
                    ))
                )}
            </div>
            <Button
                onClick={() => {
                    handleAddNewElement();
                }}
                size={'icon'}
                className="mt-auto mb-1"
            ><PlusIcon /> </Button>
            {/* {lotContainersLocation && (
                <div className="flex flex-col gap-1 ml-auto">
                    <p>
                        {lotContainersLocation.lot_container_name}: {lotContainersLocation.quantity}
                    </p>

                </div>
            )} */}
            {/* <Dialog>
                <form>
                    <DialogTrigger asChild>
                        <Button variant="outline">Vacíos</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Asignación de Vacíos</DialogTitle>
                          
        </DialogHeader >
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
                        value={locationLotContainersLocations?.[0]?.quantity || 0}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            handleUpdateLotContainersLocation(Number(newValue));
                        }}
                    />
                </div>
               
        </div >
                    </DialogContent >
                </form >
            </Dialog > */}
        </>

    )
}

export default StockLotContainerAssignation

