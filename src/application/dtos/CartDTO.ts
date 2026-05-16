export interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  quantity: number;
  priceSnapshot: number;
  lineTotal: number;
  currentStock: number;
}

export interface CartDTO {
  id: string;
  userId: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

export interface AddToCartDTO {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDTO {
  quantity: number;
}
