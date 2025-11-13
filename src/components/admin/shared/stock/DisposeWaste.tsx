import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStockMovement } from '@/service/stockMovement';
import type { StockMovement } from '@/types/stockMovements';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

const DisposeWaste = ({ lotId }: {
    lotId: number;
}) => {
    // const queryClient = useQueryClient();
    const [wasteData, setWasteData] = useState<StockMovement>({
        lot_id: lotId,
        movement_type: "WASTE",
        quantity: null,
        created_at: null,
        from_stock_room_id: null,
        to_stock_room_id: null,
        from_store_id: null,
        to_store_id: null,
        should_notify_owner: false,
        lot_containers_to_move: null,
    });

    const createLoadOrderMutation = useMutation({
        mutationFn: async () => {
            console.log("Creating waste stock movement with data:", wasteData);
            return await createStockMovement(wasteData);
        },
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: ["load-orders"] });
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
        <div className='flex gap-2'>
            <Input
                value={wasteData?.quantity ?? ""}
                onChange={(e) => {
                    const newValue = e.target.value;
                    setWasteData((prev) => ({
                        ...(prev as StockMovement),
                        quantity: newValue ? Number(newValue) : null
                    } as StockMovement))
                }} placeholder='Cantidad a desechar' type='number'
            />
            <Button
                disabled={createLoadOrderMutation.isLoading}
                onClick={() => createLoadOrderMutation.mutate()}
            >
                Desechar
            </Button>

        </div>
    )
}

export default DisposeWaste