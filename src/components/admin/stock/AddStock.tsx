import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Lot } from "@/types/lots";
import { createLot } from "@/service/lots";
import { AddLotBtn } from "../shared/stock/addStockBtn/addLotBtn";
import type { Stock } from "@/types/stocks";
import type { LotContainersStock } from "@/types/lotContainersStock";

const AddStock = () => {
    const queryClient = useQueryClient();

    const createLotMutation = useMutation({
        mutationFn: async (data: {
            lot: Lot;
            stock: Stock[];
            lotContainersStock: LotContainersStock[];
        }) => {

            //Crear el stockUnassigned  restando de initialStockQuantity el current_quantity de cada stock creado

            const totalStockAssigned = data.stock.reduce((acc, stock) => acc + stock.quantity, 0);
            const unassignedQuantity = (data.lot.initial_stock_quantity || 0) - totalStockAssigned;

            const unassignedStock: Partial<Stock> = {
                product_id: data.lot.product_id,
                quantity: unassignedQuantity,
                lot_id: data.lot.lot_id!,
                stock_type: "NOT_ASSIGNED",
                location_id: null,
            }
            if (unassignedQuantity > 0) {
                data.stock.push(unassignedStock);
            }



            console.log("Stock a crear:", data.stock);
            console.log("Stock a crear:", data.lot);
            console.log("Stock a crear:", data.lotContainersStock);

            return await createLot(data.lot, data.stock, data.lotContainersStock);
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

    const handleCreateLot = (lot: Lot, stock: Stock[], lotContainersStock: LotContainersStock[]) => {
        createLotMutation.mutate({ lot, stock, lotContainersStock });
    }

    return (
        <AddLotBtn
            onAddElement={handleCreateLot}
            loading={createLotMutation.isLoading}
        />

    )
}

export default AddStock