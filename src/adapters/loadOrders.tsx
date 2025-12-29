import type { LoadOrderUnit } from "@/types/loadOrders";
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { getUnassignedStock } from "@/utils/stock";

export const adaptLoadOrderForSubmission = (lots: Lot[], stock: Stock[], lotContainersStock: LotContainersStock[]): LoadOrderUnit[] => {

  const units: LoadOrderUnit[] = lots.map((lot) => {

    const lotStock = stock.filter((s) => s.lot_id === lot.lot_id);

    const lotContainersStockFiltered = lotContainersStock.filter((lcs) => lcs.lot_id === lot.lot_id);

    const unassignedStock = getUnassignedStock(lot, lotStock);

    if (unassignedStock) {
      // NOTE Aca estoy omitiendo el stock_id, pero no se si es correcto
      lotStock.push(unassignedStock as Stock);
    }

    return {
      lot,
      stocks: lotStock,
      lot_containers_stock: lotContainersStockFiltered,
    };
  });

  return units;

};
