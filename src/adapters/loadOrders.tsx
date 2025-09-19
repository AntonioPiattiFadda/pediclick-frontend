import type { LoadOrder } from "@/types/loadOrders";
import { v4 as uuid } from "uuid";

export const adaptLoadOrderForSubmission = (formData: LoadOrder) => {
  const { lots, ...loadOrder } = formData;

  console.log("Original Load Order:", formData);

  const adaptedLots = (lots ?? []).map((lot) => {
    const client_key = uuid(); // 👈 genera clave única por lote
    return {
      ...lot,
      initial_stock_quantity: Number(lot.initial_stock_quantity) || 0,
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
