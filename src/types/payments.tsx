export type PaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "BANK_TRANSFER"
    | "MOBILE_PAYMENT"
    | "CHECK"
    | "ON_CREDIT"
    | "CRYPTO"
    | "OVERPAYMENT";

export type PaymentType =
    | "ORDER"
    | "CLIENT_PAYMENT"
    | "PROVIDER_PAYMENT"
    | 'SALARY_PAYMENT';


// export type FinalPaymentMethod =
//     | "CASH"
//     | "CREDIT_CARD"
//     | "DEBIT_CARD"
//     | "BANK_TRANSFER"
//     | "CRYPTO";



export interface Payment {
    payment_id?: string;
    order_id: string; // referencia a la orden
    payment_method: PaymentMethod;
    amount: number;
    created_at?: string;



    // final_payment_method?: FinalPaymentMethod; // solo si es el pago final
    client_id: string | null;
    provider_id: number | null;
    payment_type: PaymentType;
    payment_direction: "IN" | "OUT";
    terminal_session_id: string | null;

    selected: boolean; // para UI
}