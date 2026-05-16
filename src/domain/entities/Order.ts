export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
