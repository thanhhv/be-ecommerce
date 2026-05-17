import { OrderStatus, PaymentMethod } from '../../domain/entities/Order';

export interface OrderItemDTO {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDTO {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  notes: string | null;
  items: OrderItemDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListItemDTO {
  id: string;
  customerName?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
  createdAt: Date;
}

export interface PlaceOrderDTO {
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}
