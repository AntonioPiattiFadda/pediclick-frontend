export type MovementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_TRANSIT';


export type PaginationType = {
    page: number;
    pageSize: number;
};

export type SellType = "WEIGHT" | "UNIT";

export type StockTypeToShow = 'STOCK' | 'SOLD' | 'NO-STOCK';
