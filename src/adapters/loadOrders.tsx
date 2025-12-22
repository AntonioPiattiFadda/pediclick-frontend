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
    console.log("unassignedStock", unassignedStock);
    if (unassignedStock) {
      lotStock.push(unassignedStock);
    }

    return {
      lot,
      stocks: lotStock,
      lot_containers_stock: lotContainersStockFiltered,
    };
  });

  return units;

};
