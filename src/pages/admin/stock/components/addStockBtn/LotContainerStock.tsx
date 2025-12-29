import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LotContainersStock } from "@/types/lotContainersStock";
import { PlusIcon, TrashIcon } from "lucide-react";
import { LotContainerSelectorRoot, SelectLotContainer } from "../../../../../components/admin/selectors/LocationContainerSelector";
import toast from "react-hot-toast";
const LotContainerStock = ({
    lotContainersStock,
    onChangeLotContainersStock,
    initialStock
}: {
    lotContainersStock: LotContainersStock[],
    onChangeLotContainersStock: (nextLotContainersStock: LotContainersStock[]) => void,
    initialStock?: number,
}) => {

    const totalLotContainersStock = lotContainersStock?.filter((lcl) => !lcl.location_id).reduce((acc, lcl) => acc + (lcl?.quantity || 0), 0) || 0;
    const remainingLotContainersToAssign = initialStock ? initialStock - totalLotContainersStock : undefined;

    const handleUpdateLotContainersStock = (lotContainerLocationId: number, quantity: number) => {
        if (remainingLotContainersToAssign !== undefined && quantity > remainingLotContainersToAssign + (lotContainersStock.find(lcl => lcl.lot_container_stock_id === lotContainerLocationId)?.quantity || 0)) {
            toast("La cantidad asignada de vacíos no puede exceder el total disponible");
            return;
        }
        const existingLCLIndex = lotContainersStock?.findIndex(s =>
            s.lot_container_stock_id === lotContainerLocationId
        ) ?? -1;
        let updatedLotContainersLocations: LotContainersStock[] = [];

        if (existingLCLIndex >= 0) {
            updatedLotContainersLocations = [...(lotContainersStock || [])];
            updatedLotContainersLocations[existingLCLIndex] = {
                ...updatedLotContainersLocations[existingLCLIndex],
                quantity: quantity,
            };
        } else {
            const newLotContainersLocation: LotContainersStock = {
                lot_container_stock_id: Date.now(),
                lot_container_id: null,
                quantity: quantity,
                created_at: null,
                location_id: null,
                client_id: null,
                provider_id: null,
                lot_container_status: 'COMPLETED',
            };
            updatedLotContainersLocations = [...(lotContainersStock || []), newLotContainersLocation];
        }
        onChangeLotContainersStock(updatedLotContainersLocations);
    };

    const handleAddNewElement = () => {
        const newLotContainersLocation: LotContainersStock = {
            lot_container_stock_id: Date.now(),
            lot_container_id: null,
            quantity: 0,
            created_at: null,
            location_id: null,
            client_id: null,
            provider_id: null,
            lot_container_status: 'COMPLETED',
        };
        const updatedLotContainersStock = [...(lotContainersStock || []), newLotContainersLocation];

        onChangeLotContainersStock(updatedLotContainersStock);
    };

    const handleDeleteElement = (lotContainerLocationId: number) => {
        const updatedLotContainersStock = lotContainersStock.filter(lcl => lcl.lot_container_stock_id !== lotContainerLocationId);
        onChangeLotContainersStock(updatedLotContainersStock);
    }

    const handleUpdateLotContainerType = (lotContainerLocationId: number, lotContainerId: number | null, lotContainerName: string | null) => {
        const existingLCLIndex = lotContainersStock?.findIndex(s =>
            s.lot_container_stock_id === lotContainerLocationId
        ) ?? -1;
        let updatedLotContainersLocations: LotContainersStock[] = [];

        if (existingLCLIndex >= 0) {
            updatedLotContainersLocations = [...(lotContainersStock || [])];
            updatedLotContainersLocations[existingLCLIndex] = {
                ...updatedLotContainersLocations[existingLCLIndex],
                lot_container_id: lotContainerId,
                lot_container_name: lotContainerName,
            };
        } else {
            const newLotContainersLocation: LotContainersStock = {
                lot_container_stock_id: Date.now(),
                lot_container_id: lotContainerId,
                quantity: 0,
                created_at: null,
                location_id: null,
                client_id: null,
                provider_id: null,
                lot_container_name: lotContainerName,
                lot_container_status: 'COMPLETED',

            };
            updatedLotContainersLocations = [...(lotContainersStock || []), newLotContainersLocation];
        }
        onChangeLotContainersStock(updatedLotContainersLocations);
    };

    const filteredLotContainers = lotContainersStock?.filter((lcl) => !lcl.location_id);

    return (
        <>
            <div className="flex flex-col gap-1 ml-auto mt-4">
                {filteredLotContainers && filteredLotContainers.length > 0 && (
                    filteredLotContainers.map((lcl) => (
                        <div key={lcl.lot_container_stock_id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                            <div className="flex flex-col gap-1">
                                <Label >Vacío</Label>
                                <LotContainerSelectorRoot
                                    value={lcl?.lot_container_id ? {
                                        lot_container_id: lcl?.lot_container_id,
                                        lot_container_name: lcl?.lot_container_name || '',
                                        lot_container_price: 0,
                                    } : null}
                                    onChange={(value) => {
                                        handleUpdateLotContainerType(lcl.lot_container_stock_id, value?.lot_container_id || null, value?.lot_container_name || null);

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
                                        handleUpdateLotContainersStock(lcl.lot_container_stock_id, Number(newValue));
                                    }}
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    handleDeleteElement(lcl.lot_container_stock_id);
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
                className="mt-auto mb-1 ml-auto"
            >
                <PlusIcon />
            </Button>

            {/* {lotContainersStock && (
                <div className="flex flex-col gap-1 ml-auto">
                <p>
                {lotContainersStock.lot_container_name}: {lotContainersStock.quantity}
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
                    lot_container_id: lotContainersStock?.lot_container_id || 0,
                    lot_container_name: lotContainersStock?.lot_container_name || '',
                    lot_container_price: 0,
                    }}
                    onChange={(value) => {
                        handleUpdateLotContainerType(value?.lot_container_id || null, value?.lot_container_name || null);
                        
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
                            handleUpdateLotContainersStock(Number(newValue));
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

export default LotContainerStock




