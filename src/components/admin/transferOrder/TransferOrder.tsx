import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { transferOrderStatuses } from "@/constants";
import { getStockRoomName } from "@/service/stockRooms";
import { getStoreName } from "@/service/stores";
import { updateTransferOrderWithItems } from "@/service/transferOrders";
import type { TransferOrderType } from "@/types/transferOrders";
import type { UserProfile } from "@/types/users";
import { formatDate } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CancelTeamMemberSelection, SelectTeamMember, TeamMemberSelectorRoot } from "../shared/selectors/TeamMemberSelector";
import LocationsSelector from "./LocationSelector";
import TransferOrderItemsTable from "./TransferOrderItemsTable";

const TransferOrder = ({
    transferOrder,
    transferOrderId,
}: {
    transferOrder: TransferOrderType;
    transferOrderId: number;
}) => {
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedLocationType, setSelectedLocationType] = useState<string | null>(null);

    useEffect(() => {
        if (transferOrder.to_store_id) {
            setSelectedLocationId(transferOrder.to_store_id);
            setSelectedLocationType("STORE");
        } else if (transferOrder.to_stock_room_id) {
            setSelectedLocationId(transferOrder.to_stock_room_id);
            setSelectedLocationType("STOCK_ROOM");
        }
    }, [transferOrder.to_store_id, transferOrder.to_stock_room_id]);

    const formattedFromId =
        selectedLocationType === "STORE"
            ? `store-${selectedLocationId}`
            : `stock-${selectedLocationId}`

    const toId = selectedLocationId ? formattedFromId : '';

    const [formData, setFormData] = useState<TransferOrderType>(transferOrder)

    const [selectedTeamMember, setSelectedTeamMember] = useState<UserProfile | null>(null);

    const queryClient = useQueryClient();

    const updateTransferOrderMutation = useMutation({
        mutationFn: async () => {
            const adaptedTransferOrder = {
                transfer_order_id: transferOrderId,
                created_at: formData.created_at,
                assigned_user_id: formData.assigned_user_id,
                from_store_id: formData.from_store_id,
                from_stock_room_id: formData.from_stock_room_id,
                to_store_id: selectedLocationType === "STORE" ? selectedLocationId : null,
                to_stock_room_id: selectedLocationType === "STOCK_ROOM" ? selectedLocationId : null,
                notes: formData.notes,
                transfer_order_status: formData.transfer_order_status
            }
            if (!formData.transfer_order_items) {
                toast("Debes agregar items a la orden antes de actualizar");
                return
            }
            const adaptedTransferOrderItems = formData.transfer_order_items.map((item) => ({
                product_id: item.product_id,
                lot_id: item.lot_id,
                quantity: item.quantity,
                is_transferred: item.is_transferred,
                transfer_order_id: item.transfer_order_id,
                // transfer_order_item_id: item.transfer_order_item_id,
                // created_at: item.created_at,
            }));

            return await updateTransferOrderWithItems(adaptedTransferOrder, adaptedTransferOrderItems);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["transfer-order", transferOrderId],
            });
            toast("Estado actualizado");
        },
        onError: (e: unknown) => {
            const msg = e instanceof Error ? e.message : "No se pudo actualizar el estado";
            toast("Error al actualizar estado", { description: msg });
        },
    });

    const getFromLocationName = async (locationId: number | null, locationType: "STORE" | "STOCK_ROOM") => {
        try {
            const response = locationType === 'STORE' ? await getStoreName(locationId) : await getStockRoomName(locationId);
            setFromLocationName(response);
        } catch (error) {
            console.error("Error fetching location name:", error);
            return null;
        }
    };

    const fromLocation = transferOrder?.from_store_id ? transferOrder?.from_store_id : transferOrder?.from_stock_room_id;
    const fromLocationType = transferOrder?.from_store_id ? "STORE" : "STOCK_ROOM";

    const [fromLocationName, setFromLocationName] = useState<string>("");

    useEffect(() => {
        getFromLocationName(fromLocation, fromLocationType);
    }, [fromLocation, fromLocationType]);

    return (
        <div className="space-y-6 ">
            <div className="w-full flex justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        Transferencia Nro: {formData.transfer_order_id}.
                    </h1>
                    <p className="text-muted-foreground">  Creada: {formatDate(formData.created_at ?? "--")} </p>
                    <p className="text-muted-foreground flex gap-2">    Desde:{fromLocationName ? fromLocationName : <Spinner />}</p>
                    <p className="text-muted-foreground flex gap-2">    Estado:<Badge>{transferOrderStatuses[formData.transfer_order_status] ?? "--"}</Badge></p>

                    <div className="flex flex-col gap-2 mt-2">
                        <Label>Asignada a:</Label>
                        <TeamMemberSelectorRoot value={selectedTeamMember} onChange={setSelectedTeamMember} >
                            <SelectTeamMember />
                            <CancelTeamMemberSelection />
                            {/* <CreateTeamMember /> */}
                        </TeamMemberSelectorRoot>
                    </div>


                </div>



                <div className="flex gap-2              h-[45px] items-center">
                    <LocationsSelector
                        onChangeSelectedLocation={(newLocationId, locationType) => {
                            setSelectedLocationId(newLocationId);
                            setSelectedLocationType(locationType);
                        }}
                        selectedLocationId={toId}
                        flexDirection="row"
                        label='Hasta'
                        placeholder='Seleccionar ubicación'
                    />
                    <Button
                        onClick={() => updateTransferOrderMutation.mutate()}
                        disabled={updateTransferOrderMutation.isLoading || !selectedLocationId || (formData?.transfer_order_items && formData?.transfer_order_items.length === 0)}
                    >
                        Actualizar Orden
                    </Button>
                </div>


            </div>
            <TransferOrderItemsTable
                transferOrder={formData}
                onChangeOrder={(updatedOrder) => {
                    setFormData(updatedOrder);
                }}

            />

            <div>
                <Label className="mb-2">Observaciones</Label>
                <Textarea value={formData?.notes ?? ""} onChange={(e) => {
                    setFormData((prev) => ({ ...prev, notes: e.target.value }));
                }} />
            </div>
        </div >
    )
}

export default TransferOrder