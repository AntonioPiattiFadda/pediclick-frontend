import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { checkHasOverSell } from '@/service/stock';
import type { Stock } from '@/types/stocks';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react'
import toast from 'react-hot-toast';

const StockCompensation = ({
    pId,
    ppId,
    stock,
    onChangeStock
}: {
    pId: number;
    ppId: number;
    stock?: Stock;
    onChangeStock: (stock: Stock) => void;
}) => {

    const checkCompensationMutation = useMutation({
        mutationFn: async (params: {
            productId: number;
            productPresentationId: number;
            locationId: number | null;
        }) => {
            return checkHasOverSell(params);
        },
        onSuccess: (response) => {

            const totalOverSell = response.reduce((acc: number, curr: Stock) => acc + (curr.over_sell_quantity || 0), 0);

            if (totalOverSell > 0) {
                onChangeStock({
                    ...stock!,
                    has_over_sell: response.length > 0,
                    is_compensation_checked: true,
                    quantity_to_compensate: totalOverSell,
                });
            } else {
                onChangeStock({
                    ...stock!,
                    has_over_sell: false,
                    is_compensation_checked: true,
                    quantity_to_compensate: totalOverSell,
                });
            }

        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    useEffect(() => {
        if (stock?.is_compensation_checked === false) {
            checkCompensationMutation.mutate({
                productId: pId,
                productPresentationId: ppId,
                locationId: stock?.location_id || null,
            });
        }
    }, [stock, pId, ppId]);

    if (checkCompensationMutation.isLoading) {
        return <div>Cargando...</div>
    }

    if (!stock?.is_compensation_checked) {
        return <div>Esperando para verificar sobreventa...</div>
    }

    if (!stock?.is_compensation_checked || !stock?.has_over_sell) {
        return null
    }

    return (
        <div className='flex gap-1'>
            <Label>Compensar sobreventa de lote anterior: ({stock?.quantity_to_compensate})</Label>

            <Switch
                onCheckedChange={(e) => {
                    console.log('Switch onChange', e);
                    onChangeStock({
                        ...stock!,
                        has_to_compensate: Boolean(e),
                    })
                }}
                checked={stock?.has_to_compensate}
            />

        </div>
    )
}

export default StockCompensation