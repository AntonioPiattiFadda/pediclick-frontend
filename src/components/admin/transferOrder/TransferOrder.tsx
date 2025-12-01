import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { transferOrderStatuses } from "@/constants";
import { transferOrderWithItems, updateTransferOrderWithItems } from "@/service/transferOrders";
import type { Location } from "@/types/locations";
import type { LotContainerMovement, MovementStatus } from "@/types/lotContainerMovements";
import type { TransferOrderType } from "@/types/transferOrders";
import type { UserProfile } from "@/types/users";
import { formatDate } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LocationSelectorRoot, SelectLocation } from "../shared/selectors/locationSelector";
import { CancelTeamMemberSelection, SelectTeamMember, TeamMemberSelectorRoot } from "../shared/selectors/TeamMemberSelector";
import TransferOrderItemsTable from "./TransferOrderItemsTable";

const TransferOrder = ({
    transferOrder,
    transferOrderId,
}: {
    transferOrder: TransferOrderType;
    transferOrderId: number;
}) => {
    const [toLocationId, setToLocationId] = useState<Partial<Location> | null>(transferOrder.to_location_id ? {
        location_id: transferOrder.to_location_id,
        name: transferOrder.to_location?.name,
        type: transferOrder.to_location?.type,
    } : null);

    const [formData, setFormData] = useState<TransferOrderType>(transferOrder)

    const [selectedTeamMember, setSelectedTeamMember] = useState<UserProfile | null>(transferOrder.assigned_user ?? null);

    const [searchParams] = useSearchParams();
    const isTransferring = searchParams.get("transferring") === "true" ? true : false;

    const queryClient = useQueryClient();

    const updateTransferOrderMutation = useMutation({
        mutationFn: async () => {

            //SECTION TRANSFER 

            if (isTransferring) {
                const adaptedForTransferringTransferOrderItems = formData.transfer_order_items
                    .filter(item => !item.is_transferred)
                    .map((item) => {
                        const adaptedLotContainerMovement: Pick<LotContainerMovement, 'quantity' | 'lot_container_movement_id' | 'status'>[] = [{
                            quantity: item.lot_containers_location?.quantity || 0,
                            lot_container_movement_id: item.lot_containers_movement?.lot_container_movement_id || null,
                            status: 'COMPLETED',
                            // from_store_id: formData.from_store_id,
                            // from_stock_room_id: formData.from_stock_room_id,
                            // to_store_id: selectedLocationType === "STORE" ? selectedLocationId : null,
                            // to_stock_room_id: selectedLocationType === "STOCK_ROOM" ? selectedLocationId : null,
                            // from_provider_id: null,
                            // to_provider_id: null,
                            // from_client_id: null,
                            // to_client_id: null,

                            // lot_container_id: item.lot_containers_movement?.lot_container_id || 0,
                            // lot_containers_location_id: item.lot_containers_movement?.lot_containers_location_id || null,

                            // from_store_name: null,
                            // to_store_name: null,
                            // from_stock_room_name: null,
                            // to_stock_room_name: null,
                            // from_provider_name: null,
                            // to_provider_name: null,
                            // from_client_name: null,
                            // to_client_name: null,

                            // is_new: item.is_new || false
                        }]
                        console.log("🟢 adaptedLotContainerLocations:", adaptedLotContainerMovement);

                        return ({
                            transfer_order_item_id: item.is_new ? null : item.transfer_order_item_id,
                            transfer_order_id: item.transfer_order_id,
                            status: 'COMPLETED' as MovementStatus,
                            lot_containers_movements: adaptedLotContainerMovement,
                            is_transferred: true,
                            stock_id: item?.stock_id || null,
                            quantity: item.quantity,
                            to_location_id: transferOrder.to_location_id,
                            product_id: item.product_id,
                            product_presentation_id: item.product_presentation_id,
                            lot_id: item.lot_id,
                        })
                    }
                    );

                const transferOrderStatus = formData.transfer_order_items.every(item => item.is_transferred || false) ? 'COMPLETED' as MovementStatus : 'PENDING' as MovementStatus;

                console.log("🟢 transferOrderStatus:", transferOrderStatus);

                const adaptedforTransferringTransferOrder = {
                    transfer_order_id: transferOrderId,
                    created_at: formData.created_at,
                    assigned_user_id: formData.assigned_user_id,
                    from_location_id: formData.from_location_id,
                    to_location_id: toLocationId?.location_id || null,
                    notes: formData.notes,
                    status: transferOrderStatus
                }
                console.log("🟢 adaptedforTransferringTransferOrder:", adaptedforTransferringTransferOrder);
                console.log("🟢 adaptedForTransferringTransferOrderItems:", adaptedForTransferringTransferOrderItems);

                return await transferOrderWithItems(adaptedforTransferringTransferOrder, adaptedForTransferringTransferOrderItems);
            }


            //SECTION Update
            const adaptedTransferOrder = {
                transfer_order_id: transferOrderId,
                created_at: formData.created_at,
                assigned_user_id: formData.assigned_user_id,
                from_location_id: formData.from_location_id,
                to_location_id: toLocationId?.location_id || null,
                notes: formData.notes,
                status: formData.status
            }
            if (!formData.transfer_order_items) {
                toast("Debes agregar items a la orden antes de actualizar");
                return
            }
            const adaptedTransferOrderItems = formData.transfer_order_items.map((item) => {
                console.log("🟢 item en adaptedTransferOrderItems:", item);
                console.log("🟢 item en adaptedTransferOrderItems:", item.lot_containers_location);
                console.log("🟢 item en adaptedTransferOrderItems:", item.lot_containers_movement);
                console.log("🟢 item en adaptedTransferOrderItems:", item.lot_containers_location_id);
                const adaptedLotContainerMovement: Omit<LotContainerMovement, 'created_at'>[] = [{
                    quantity: item.lot_containers_location?.quantity || 0,
                    lot_container_movement_id: item.lot_containers_movement?.lot_container_movement_id || null,
                    from_location_id: formData.from_location_id,
                    to_location_id: toLocationId?.location_id || null,
                    from_provider_id: null,
                    to_provider_id: null,
                    from_client_id: null,
                    to_client_id: null,

                    lot_container_id: item.lot_containers_movement?.lot_container_id || 0,
                    lot_containers_location_id: item.lot_containers_movement?.lot_containers_location_id || null,

                    from_store_name: null,
                    to_store_name: null,
                    from_stock_room_name: null,
                    to_stock_room_name: null,
                    from_provider_name: null,
                    to_provider_name: null,
                    from_client_name: null,
                    to_client_name: null,
                    lot_container_status: 'PENDING',

                    is_new: item.is_new || false
                }]
                console.log("🟢 adaptedLotContainerLocations:", adaptedLotContainerMovement);
                const filteredLotContainerMovement = adaptedLotContainerMovement.filter(lcm => lcm.quantity > 0);

                return ({
                    transfer_order_item_id: item.is_new ? null : item.transfer_order_item_id,
                    product_id: item.product_id,
                    product_presentation_id: item.product_presentation_id,
                    lot_id: item.lot_id,
                    quantity: item.quantity,
                    transfer_order_id: item.transfer_order_id,
                    status: 'PENDING' as MovementStatus,
                    lot_containers_movements: filteredLotContainerMovement,
                    lot_containers_location_id: item.lot_containers_movement?.lot_containers_location_id || null,
                    lot_container_movement_id: item.lot_containers_movement?.lot_container_movement_id || null,
                    is_transferred: item.is_transferred || false,
                    is_new: item.is_new || false,
                    stock_id: item?.stock_id || null,
                })
            }
            );


            console.log("🟢 adaptedTransferOrderItems:", adaptedTransferOrderItems);
            // lot_container_location_id: number | null;
            // lot_container_movement_id: number | null;

            // const adaptedLotContainerLocations = formData.transfer_order_items.flatMap((item) =>
            //     item.lot?.lot_containers_location?.map((location) => ({
            //         ...location,
            //         // Any necessary adaptations can be made here
            //     })) || []
            // );
            //Crear el lotContainerLocation pending

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


    return (
        <div className="space-y-6 ">
            <div className="w-full flex justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        Transferencia Nro: {formData.transfer_order_id}.
                    </h1>
                    <p className="text-muted-foreground">  Creada: {formatDate(formData.created_at ?? "--")} </p>
                    <p className="text-muted-foreground flex gap-2">    Desde:{formData.from_location?.name}</p>
                    <p className="text-muted-foreground flex gap-2">    Estado:<Badge>{transferOrderStatuses[formData.status] ?? "--"}</Badge></p>

                    <div className="flex flex-col gap-2 mt-2">
                        <Label>Asignada a:</Label>
                        <TeamMemberSelectorRoot
                            disabled={updateTransferOrderMutation.isLoading || isTransferring}
                            value={selectedTeamMember}
                            onChange={(member) => {
                                setSelectedTeamMember(member);
                                setFormData((prev) => ({ ...prev, assigned_user_id: member ? member.id : null }));
                            }} >
                            <SelectTeamMember />
                            {!isTransferring && (
                                <CancelTeamMemberSelection />
                            )}
                            {/* <CreateTeamMember /> */}
                        </TeamMemberSelectorRoot>
                    </div>
                </div>

                <div className="flex gap-2              h-fit items-center">
                    <div className="flex flex-col gap-1">
                        <Label>Ubicación Destino:</Label>
                        <LocationSelectorRoot omitId={transferOrder.from_location_id} value={toLocationId} onChange={setToLocationId}>
                            <SelectLocation />
                            {/* <CreateLocation /> */}
                        </LocationSelectorRoot>
                    </div>
                    {transferOrder.status === 'PENDING' && (
                        <Button
                            className="mt-auto mb-[2px]"
                            onClick={() => updateTransferOrderMutation.mutate()}
                            disabled={updateTransferOrderMutation.isLoading || !toLocationId || (formData?.transfer_order_items && formData?.transfer_order_items.length === 0)}
                        >
                            Actualizar Orden
                        </Button>
                    )}
                </div>

            </div>
            <TransferOrderItemsTable
                transferOrder={formData}
                onChangeOrder={(updatedOrder) => {
                    setFormData(updatedOrder);
                }}
                isTransferring={isTransferring}
            />
            <div>
                <Label className="mb-2">Observaciones</Label>
                <Textarea
                    value={formData?.notes ?? ""}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, notes: e.target.value }));
                    }} />
            </div>
        </div >
    )
}

export default TransferOrder