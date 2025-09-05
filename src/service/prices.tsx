import { supabase } from ".";

export const getPricesByLot = async (lotId: number) => {
  const { data: prices, error } = await supabase
    .from("prices")
    .select(`*`)
    .eq("lot_id", lotId);

  if (error) throw new Error(error.message);

  return { prices, error: null };
};

export const upsertPrice = async (lotId: string) => {};
export const deletePrice = async (lotId: string) => {};
