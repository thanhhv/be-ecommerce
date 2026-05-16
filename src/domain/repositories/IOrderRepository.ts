import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderData {
  id: string;
  userId: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  notes?: string;
}

export interface CreateOrderItemData {
  id: string;
  orderId: string;
  productId: string | null;
  productNameSnapshot: string;
  productImageSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface IOrderRepository {
  create(data: CreateOrderData, items: CreateOrderItemData[]): Promise<OrderWithItems>;
  findById(id: string): Promise<OrderWithItems | null>;
  findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number }>;
  findAll(filter: OrderFilter): Promise<{ data: Order[]; total: number }>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
