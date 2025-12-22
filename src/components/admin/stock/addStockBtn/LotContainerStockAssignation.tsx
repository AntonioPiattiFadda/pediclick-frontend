import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LotContainersStock } from "@/types/lotContainersStock";
import { LotContainerSelectorRoot, SelectLotContainer } from "../../shared/selectors/LocationContainerSelector";
import toast from "react-hot-toast";

const LotContainerStockAssignation = ({
    lotContainersStock,
    onChangeLotContainersStock,
    locationId,
    assignedStockQuantity
}: {
    lotContainersStock: LotContainersStock[];
    onChangeLotContainersStock: (nextLotContainersStock: LotContainersStock[]) => void;
    locationId: number;
    assignedStockQuantity: number;
}) => {

    const calculateLotContainerIdStockAvailability = (lotContainerId: number | undefined | null, quantity: number) => {
        const totalOnOtherLocations = lotContainersStock
            .filter(lcl => lcl.lot_container_id === lotContainerId && lcl.location_id !== locationId && lcl.location_id !== null)
            .reduce((acc, lcl) => acc + (lcl.quantity || 0), 0);

        const totalOriginal = lotContainersStock
            .filter(lcl => lcl.lot_container_id === lotContainerId && lcl.location_id === null)
            .reduce((acc, lcl) => acc + (lcl.quantity || 0), 0);

        const remainingQty = totalOriginal - totalOnOtherLocations;

        const otherTypesAssignedToLocation = lotContainersStock
            .filter(lcl => lcl.location_id === locationId && lcl.lot_container_id !== lotContainerId)
            .reduce((acc, lcl) => acc + (lcl.quantity || 0), 0);

        if (otherTypesAssignedToLocation + quantity > assignedStockQuantity) {
            toast("La cantidad total de vacíos asignados no puede exceder el total disponible en stock para esta ubicación");
            return false;
        }

        if (remainingQty < quantity) {
            toast("La cantidad asignada de vacíos no puede exceder el total disponible para ese tipo de vacío");
            return false;
        }
        return true;
    }

    const handleAssignOrUpdateQuantity = (
        originalContainerId: number,
        quantity: number
    ) => {
        const existing = lotContainersStock.find(
            (item) =>
                item.location_id === locationId &&
                item.lot_container_stock_id === originalContainerId
        );

        if (!calculateLotContainerIdStockAvailability(existing?.lot_container_id, quantity)) {
            return;
        }

        let updated: LotContainersStock[] = [];

        if (existing) {
            // 🔄 Update existing assigned row
            updated = lotContainersStock.map((item) =>
                item.lot_container_stock_id === originalContainerId
                    ? { ...item, quantity }
                    : item
            );
        }
        // else {
        //     // 🆕 Create new assigned row based on the original
        //     const original = lotContainersStock.find(
        //         (item) => item.lot_container_stock_id === originalContainerId
        //     );

        //     if (!original) return;

        //     const newAssigned: LotContainersStock = {
        //         ...original,
        //         lot_container_stock_id: Date.now(), // a new ID for location-assigned instance
        //         location_id: locationId || null,
        //         quantity,
        //     };

        //     updated = [...lotContainersStock, newAssigned];
        // }

        onChangeLotContainersStock(updated);
    };

    const filteredLotContainers = lotContainersStock?.filter((lcl) => lcl.location_id === locationId);

    return (
        <>
            <div className="flex flex-col gap-1 ml-auto mt-4">
                {filteredLotContainers && filteredLotContainers.length > 0 && (
                    filteredLotContainers.map((lcl) => (
                        <div key={lcl.lot_container_stock_id} className="flex gap-2">
                            <div className="flex flex-col gap-1">
                                <Label >Vacío</Label>
                                <LotContainerSelectorRoot
                                    disabled={true}
                                    value={{
                                        lot_container_id: lcl?.lot_container_id || 0,
                                        lot_container_name: lcl?.lot_container_name || '',
                                        lot_container_price: 0,
                                    }}
                                    onChange={() => { }}
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
                                        handleAssignOrUpdateQuantity(lcl.lot_container_stock_id, Number(newValue));
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    )
};

export default LotContainerStockAssignation;
