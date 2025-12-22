import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Lot } from "@/types/lots";
import { createLot } from "@/service/lots";
import { AddLotBtn } from "../../../../components/admin/stock/addStockBtn/addLotBtn";
import type { Stock } from "@/types/stocks";
import type { LotContainersStock } from "@/types/lotContainersStock";
import { getUnassignedStock } from "@/utils/stock";
import toast from "react-hot-toast";

const AddStock = () => {
    const queryClient = useQueryClient();

    const createLotMutation = useMutation({
        mutationFn: async (data: {
            lot: Lot;
            stock: Stock[];
            lotContainersStock: LotContainersStock[];
        }) => {

            const unassignedStock = getUnassignedStock(data.lot, data.stock);

            if (unassignedStock) {
                data.stock.push(unassignedStock);
            }

            return await createLot(data.lot, data.stock, data.lotContainersStock);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Lote creado correctamente");
        },
        onError: (error) => {
            const errorMessage =
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message?: unknown }).message)
                    : "Error desconocido";
            toast.error("Error al crear el remito: " + errorMessage);
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