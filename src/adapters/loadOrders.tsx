import type { LoadOrder } from "@/types/loadOrders";
import { v4 as uuid } from "uuid";

export const adaptLoadOrderForSubmission = (formData: LoadOrder) => {
  const { lots, ...loadOrder } = formData;

  const adaptedLots = (lots ?? []).map((lot) => {
    const client_key = uuid(); // 👈 genera clave única por lote
    return {
      ...lot,
      client_key,
    };
  });
  const adaptedPrices = (lots ?? []).flatMap((lot, index) =>
    (lot.prices || []).map((price) => ({
      ...price,
      lot_client_key: adaptedLots[index].client_key, // 👈 relación con el lote
    }))
  );

  console.log("Adapted Load Order:", { loadOrder, adaptedLots, adaptedPrices });

  return {
    loadOrder,
    lots: adaptedLots,
    prices: adaptedPrices,
  };
};
