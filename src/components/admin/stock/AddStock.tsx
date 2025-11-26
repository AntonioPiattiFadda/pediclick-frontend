import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Lot } from "@/types/lots";
import { createLot } from "@/service/lots";
import { AddLotBtn } from "../shared/stock/addStockBtn/addLotBtn";
import type { Stock } from "@/types/stocks";
import type { LotContainersLocation } from "@/types/lotContainersLocation";

const AddStock = () => {
    const queryClient = useQueryClient();

    const createLotMutation = useMutation({
        mutationFn: async (data: {
            lot: Lot;
            stock: Stock[];
            lotContainersLocation: LotContainersLocation[];
        }) => {

            //Crear el stockUnassigned  restando de initialStockQuantity el current_quantity de cada stock creado

            const totalStockAssigned = data.stock.reduce((acc, stock) => acc + stock.current_quantity, 0);
            const unassignedQuantity = (data.lot.initial_stock_quantity || 0) - totalStockAssigned;

            const unassignedStock: Stock = {
                product_id: data.lot.product_id,
                store_id: null,
                stock_room_id: null,
                current_quantity: unassignedQuantity,
                lot_id: data.lot.lot_id!,
                min_notification: null,
                max_notification: null,
                stock_type: "NOT_ASSIGNED",
                reserved_for_transferring_quantity: null,
                reserved_for_selling_quantity: null,
                transformed_from_product_id: null,
                // transformed_to_product_id: null,
                updated_at: null,
            }
            if (unassignedQuantity > 0) {
                data.stock.push(unassignedStock);
            }
            return await createLot(data.lot, data.stock, data.lotContainersLocation);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Lote creado con éxito");
        },
        onError: (error) => {
            const errorMessage =
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message?: unknown }).message)
                    : "Error desconocido";
            toast("Error al crear el remito", {
                description: errorMessage,
            });
        },
    });

    const handleCreateLot = (lot: Lot, stock: Stock[], lotContainersLocation: LotContainersLocation[]) => {
        createLotMutation.mutate({ lot, stock, lotContainersLocation });
    }

    return (
        <AddLotBtn
            onAddElement={handleCreateLot}
            loading={createLotMutation.isLoading}
        />

    )
}

export default AddStock