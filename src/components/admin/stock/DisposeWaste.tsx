import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getUserId } from '@/service';
import { createWasteStockMovement } from '@/service/stockMovement';
import type { StockMovement } from '@/types/stockMovements';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DisposeWaste = ({ lotId, stockId }: {
    lotId: number;
    stockId: number;
}) => {
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);

    const [wasteData, setWasteData] = useState<Omit<StockMovement, "stock_movement_id">>({
        lot_id: lotId,
        stock_id: stockId,
        movement_type: "WASTE",
        quantity: null,
        created_at: null,
        to_location_id: null,
        from_location_id: null,
        should_notify_owner: false,
        lot_containers_to_move: null,
        created_by: null,
    });


    const { data: userId, isLoading: isLoadingUserId, isError: isErrorUserId } = useQuery({
        queryKey: ["user-id"],
        queryFn: getUserId,
    });

    const createLoadOrderMutation = useMutation({
        mutationFn: async () => {
            return await createWasteStockMovement({
                ...wasteData,
                created_by: userId || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Merma registrada con éxito");
            setOpen(false);
        },
        onError: (error) => {
            const errorMessage =
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message?: unknown }).message)
                    : "Error desconocido";
            toast.error("Error al crear merma: " + errorMessage
            );
        },
    });


    if (isLoadingUserId) {
        return null;
    }

    if (isErrorUserId) {
        return <div>Error al cargar el usuario</div>;
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash size={12} />
                </Button>
            </DialogTrigger>
            <DialogContent className='max-w-[350px]'>
                <h3 className='text-lg font-medium mb-2'>Mermar stock</h3>
                <div className='flex gap-2'>
                    <Input
                        value={wasteData?.quantity ?? ""}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setWasteData((prev) => ({
                                ...(prev as StockMovement),
                                quantity: newValue ? Number(newValue) : null
                            } as StockMovement))
                        }} placeholder='Cantidad a mermar' type='number'
                    />
                    <Button
                        disabled={createLoadOrderMutation.isLoading}
                        onClick={() => createLoadOrderMutation.mutate()}
                    >
                        Desechar
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DisposeWaste