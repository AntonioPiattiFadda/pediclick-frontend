import { supabase } from ".";

export const getLotPerformance = async (lotId: number) => {
    //FIXME no esta entregando informacion valiosa
    const { data, error } = await supabase.rpc("get_lot_performance", {
        p_lot_id: lotId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
