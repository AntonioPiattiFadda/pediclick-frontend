
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";

export type StockWithRelations = Stock & {
    stores?: { store_name?: string } | null;
    stock_rooms?: { stock_room_name?: string } | null;
};


export const formatStockLocation = (stockItem: StockWithRelations) => {
    const type = stockItem?.stock_type as string | undefined;
    if (type === "STORE") {
        const name = stockItem?.stores?.store_name || "Tienda";
        return { typeLabel: "Tienda", nameLabel: name, isStore: true };
    }
    if (type === "STOCKROOM") {
        const name = stockItem?.stock_rooms?.stock_room_name || "Depósito";
        return { typeLabel: "Depósito", nameLabel: name, isStore: false };
    }
    if (type === "NOT ASSIGNED") {
        return { typeLabel: "No asignado", nameLabel: "", isStore: false };
    }
    if (type === "WASTE") {
        return { typeLabel: "Merma", nameLabel: "", isStore: false };
    }
    if (type === "SOLD") {
        return { typeLabel: "Vendido", nameLabel: "", isStore: false };
    }
    if (type === "TRANSFORMED") {
        return { typeLabel: "Transformado", nameLabel: "", isStore: false };
    }
    return { typeLabel: type || "Otro", nameLabel: "", isStore: false };
};

// export function redistributeUnassigned(lotContainersStock: LotContainersStock[]): LotContainersStock[] {
//     // Agrupar por lot_container_id
//     const groups = lotContainersStock.reduce((acc, item) => {
//         if (!acc[item.lot_container_id]) acc[item.lot_container_id] = [];
//         acc[item.lot_container_id].push(item);
//         return acc;
//     }, {});

//     const result = [];

//     Object.values(groups).forEach((group) => {
//         let totalAssigned = 0;
//         let unassignedRow = null;

//         // Buscar asignados y no asignado
//         group.forEach((item) => {
//             if (item.location_id) {
//                 totalAssigned += item.quantity ?? 0;
//             } else {
//                 unassignedRow = item;
//             }
//         });

//         // Actualizar el unassigned restando el totalAssigned
//         if (unassignedRow) {
//             unassignedRow = {
//                 ...unassignedRow,
//                 quantity: Math.max((unassignedRow.quantity ?? 0) - totalAssigned, 0),
//             };
//         }

//         // Agregar al resultado: primero el unassigned, luego los assigned
//         if (unassignedRow) result.push(unassignedRow);
//         group.forEach((item) => {
//             if (item.location_id) result.push(item);
//         });
//     });

//     return result;
// }

export const getLotData = (lots: Lot[], lotId: number | null, locationId: number) => {

    let lot;

    if (lotId) {
        lot = lots.find((l) => l.lot_id === lotId);

    } else {
        lot = lots[0];
    }

    const lotStock = lot?.stock?.find((s) => Number(s.location_id) === locationId);

    const max_quantity = lotStock ? Number(lotStock.quantity) - (lotStock?.reserved_for_selling_quantity ?? 0) - (lotStock?.reserved_for_transferring_quantity ?? 0) : null;

    return {
        lot_id: lot?.lot_id || null,
        final_cost_per_unit: lot?.final_cost_per_unit || null,
        final_cost_per_bulk: lot?.final_cost_per_bulk || null,
        final_cost_total: lot?.final_cost_total || null,
        stock_id: lotStock?.stock_id || null,
        max_quantity: max_quantity,
        lot: lot,
        provider_id: lot?.provider_id || null,
        expiration_date: lot?.expiration_date || null,
        expiration_date_notification: lot?.expiration_date_notification ?? false,
    }
}

export const getUnassignedStock = (lot: Lot, stock: Stock[]): Omit<Stock, "stock_id"> | null => {
    const totalStockAssigned = stock.reduce((acc: number, stock: Stock) => acc + stock.quantity, 0);
    const unassignedQuantity = (lot.initial_stock_quantity || 0) - totalStockAssigned;

    const unassignedStock: Omit<Stock, "stock_id"> = {
        product_id: lot.product_id,
        quantity: unassignedQuantity,
        lot_id: lot.lot_id!,
        stock_type: "NOT_ASSIGNED",
        location_id: null,
        min_notification: lot.stock?.[0]?.min_notification || null,
        max_notification: lot.stock?.[0]?.max_notification || null,
        reserved_for_transferring_quantity: lot.stock?.[0]?.reserved_for_transferring_quantity || null,
        reserved_for_selling_quantity: lot.stock?.[0]?.reserved_for_selling_quantity || null,
        transformed_from_product_id: lot.stock?.[0]?.transformed_from_product_id || null,
        updated_at: null,
    }
    if (unassignedQuantity > 0) {
        return unassignedStock;
    }

    return null;
}