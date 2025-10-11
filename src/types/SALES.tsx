export interface SalesHistoryRow {
    order_id: number;
    order_date: string; // timestamptz
    client_id: number;
    lot_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;


}


export interface StockSalesHistoryRow {
    movement_id: number;
    movement_date: string; // timestamptz
    lot_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;


    runningTotal?: number;
    subtotal?: number;
}