import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddLotBtn } from "../shared/addLotBtn";
import type { Lot } from "@/types/lots";
import { createLot } from "@/service/lots";

const AddStock = () => {
    const queryClient = useQueryClient();

    const createLotMutation = useMutation({
        mutationFn: async (data: Lot) => {
            return await createLot(data);
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



    return (
        <AddLotBtn
            onAddElement={(lot: Lot) => { createLotMutation.mutate(lot) }}
            loading={createLotMutation.isLoading}
        />

    )
}

export default AddStock