export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceSnapshot: number; // VND integer, price at time of adding
  createdAt: Date;
}
