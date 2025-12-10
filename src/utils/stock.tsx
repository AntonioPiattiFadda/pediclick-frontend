import type { LotContainersStock } from "@/types/lotContainersStock";
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

export function redistributeUnassigned(lotContainersStock: LotContainersStock[]): LotContainersStock[] {
    // Agrupar por lot_container_id
    const groups = lotContainersStock.reduce((acc, item) => {
        if (!acc[item.lot_container_id]) acc[item.lot_container_id] = [];
        acc[item.lot_container_id].push(item);
        return acc;
    }, {});

    const result = [];

    Object.values(groups).forEach((group) => {
        let totalAssigned = 0;
        let unassignedRow = null;

        // Buscar asignados y no asignado
        group.forEach((item) => {
            if (item.location_id) {
                totalAssigned += item.quantity ?? 0;
            } else {
                unassignedRow = item;
            }
        });

        // Actualizar el unassigned restando el totalAssigned
        if (unassignedRow) {
            unassignedRow = {
                ...unassignedRow,
                quantity: Math.max((unassignedRow.quantity ?? 0) - totalAssigned, 0),
            };
        }

        // Agregar al resultado: primero el unassigned, luego los assigned
        if (unassignedRow) result.push(unassignedRow);
        group.forEach((item) => {
            if (item.location_id) result.push(item);
        });
    });

    return result;
}