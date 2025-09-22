// =======================
// Client Transactions

import type { PaymentMethod } from "./orderPayments";
import type { PaymentStatus } from "./orders";

// =======================
export type TransactionType = "PAYMENT" | "REFUND"


export interface ClientTransaction {
  transaction_id: string;
  client_id: string;
  order_id?: string;
  amount: number;
  description?: string;
  created_at: string;


  //NOTE SACAR transaction type
  transaction_type: TransactionType;
  transaction_date: string;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  balance_after_transaction: number;
}
