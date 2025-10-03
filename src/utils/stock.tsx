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