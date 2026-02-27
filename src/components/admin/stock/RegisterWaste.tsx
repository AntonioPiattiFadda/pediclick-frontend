import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LocationSelectorRoot, SelectLocation } from '@/components/admin/selectors/locationSelector';
import { getUserId } from '@/service';
import { getProductPresentation } from '@/service/productPresentations';
import { createWasteStockMovement } from '@/service/stockMovement';
import type { Location } from '@/types/locations';
import type { StockMovement } from '@/types/stockMovements';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const RegisterWaste = ({ lotId, stockId, productPresentationId }: {
    lotId: number;
    stockId: number;
    productPresentationId: number;
}) => {
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null);
    const [quantity, setQuantity] = useState<number | null>(null);

    const { data: userId } = useQuery({
        queryKey: ["user-id"],
        queryFn: getUserId,
    });

    const { data: presentationData } = useQuery({
        queryKey: ["product-presentation", productPresentationId],
        queryFn: () => getProductPresentation(productPresentationId),
        enabled: open,
    });

    const presentation = presentationData?.presentation;
    const bqe = presentation?.bulk_quantity_equivalence ?? 1;
    const qtyInBaseUnits = quantity !== null ? quantity * bqe : null;
    const presentationName = presentation?.product_presentation_name ?? "";
    const productName = (presentation?.products as { product_name: string } | null)?.product_name ?? "";

    const createWasteMutation = useMutation({
        mutationFn: async () => {
            const wasteData: Omit<StockMovement, "stock_movement_id"> = {
                lot_id: lotId,
                stock_id: stockId,
                movement_type: "WASTE",
                quantity,
                qty_in_base_units: qtyInBaseUnits,
                product_presentation_id: productPresentationId,
                from_location_id: selectedLocation?.location_id ?? null,
                to_location_id: null,
                should_notify_owner: false,
                created_by: userId || null,
            };
            return await createWasteStockMovement(wasteData);
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
            toast.error("Error al crear merma: " + errorMessage);
        },
    });

    const isSubmitDisabled =
        createWasteMutation.isLoading ||
        !selectedLocation ||
        quantity === null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash size={12} />
                </Button>
            </DialogTrigger>
            <DialogContent className='max-w-[380px]'>
                <h3 className='text-lg font-medium mb-2'>Mermar stock</h3>
                <div className='flex flex-col gap-3'>
                    <LocationSelectorRoot
                        value={selectedLocation}
                        onChange={setSelectedLocation}
                    >
                        <SelectLocation />
                    </LocationSelectorRoot>
                    <div className='flex flex-col gap-1'>
                        <p className='text-sm text-muted-foreground'>Cantidad a mermar</p>
                        <Input
                            value={quantity ?? ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setQuantity(val ? Number(val) : null);
                            }}
                            placeholder='Cantidad'
                            type='number'
                        />
                        {quantity !== null && presentationName && (
                            <div className='text-sm mt-1'>
                                <span>{quantity} {presentationName} de {productName}</span>
                                {bqe !== 1 && (
                                    <p className='text-muted-foreground'>= {qtyInBaseUnits} unidades base</p>
                                )}
                            </div>
                        )}
                    </div>
                    <Button
                        disabled={isSubmitDisabled}
                        onClick={() => createWasteMutation.mutate()}
                    >
                        Desechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterWaste;
