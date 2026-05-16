import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
}

export interface CartItemWithProduct extends CartItem {
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  currentStock: number;
}

export interface ICartRepository {
  findOrCreateByUserId(userId: string): Promise<Cart>;
  findWithItemsByUserId(userId: string): Promise<CartWithItems>;
  addItem(
    cartId: string,
    productId: string,
    quantity: number,
    priceSnapshot: number,
  ): Promise<CartItem>;
  findItem(cartId: string, productId: string): Promise<CartItem | null>;
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;
  removeItem(itemId: string): Promise<void>;
  clearItems(cartId: string): Promise<void>;
  findItemById(itemId: string): Promise<CartItem | null>;
}
