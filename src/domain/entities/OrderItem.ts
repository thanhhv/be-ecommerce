export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productNameSnapshot: string;
  productImageSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
