export type ClientType = "FINAL" | "REGISTERED"
export type OrderType = "DIRECT_SALE" | "CREDIT_ORDER" | "RESERVATION" | "ONLINE_PICKUP"
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED" | "PARTIALLY_REFUNDED"
export type OrderStatus = "NEW" | "PROCESSING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURNED" | "DELIVERING"


// FIXME Una cosa es el paymentStatus que tiene relacion con el pago y otra es el estado que tiene que ver con que se creo recien o esta reservada o esta enenvio, etc
export interface Order {
  order_id?: number;
  business_owner_id?: number;
  store_id: number;
  client_type: ClientType;
  client_id?: number | null;
  provider_id?: number;
  order_number: string;
  order_type: OrderType;
  order_status: OrderStatus;

  // 🔥 eliminamos payment_method y final_payment_method
  // en su lugar, tendremos OrderPayment[] asociado a la orden
  payment_status: PaymentStatus;

  subtotal: number;
  discount?: number;
  tax?: number;
  total_amount: number;
  currency: string;
  notes?: string;
  delivery_date?: string; // ISO date string
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}


