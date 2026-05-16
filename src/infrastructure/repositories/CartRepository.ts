import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/knex';
import {
  ICartRepository,
  CartWithItems,
  CartItemWithProduct,
} from '../../domain/repositories/ICartRepository';
import { Cart } from '../../domain/entities/Cart';
import { CartItem } from '../../domain/entities/CartItem';

export class CartRepository implements ICartRepository {
  private toCart(row: Record<string, unknown>): Cart {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private toCartItem(row: Record<string, unknown>): CartItem {
    return {
      id: row.id as string,
      cartId: row.cart_id as string,
      productId: row.product_id as string,
      quantity: row.quantity as number,
      priceSnapshot: row.price_snapshot as number,
      createdAt: new Date(row.created_at as string),
    };
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    let row = await db('carts').where({ user_id: userId }).first();
    if (!row) {
      const [inserted] = await db('carts').insert({ id: uuidv4(), user_id: userId }).returning('*');
      row = inserted;
    }
    return this.toCart(row);
  }

  async findWithItemsByUserId(userId: string): Promise<CartWithItems> {
    const cart = await this.findOrCreateByUserId(userId);

    const rows = await db('cart_items as ci')
      .join('products as p', 'ci.product_id', 'p.id')
      .leftJoin(
        db('product_images').where('is_primary', true).select('product_id', 'url').as('pi'),
        'p.id',
        'pi.product_id',
      )
      .where('ci.cart_id', cart.id)
      .select(
        'ci.id',
        'ci.cart_id',
        'ci.product_id',
        'ci.quantity',
        'ci.price_snapshot',
        'ci.created_at',
        'p.name as product_name',
        'p.slug as product_slug',
        'p.stock as current_stock',
        'pi.url as product_image_url',
      );

    const items: CartItemWithProduct[] = rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      cartId: r.cart_id as string,
      productId: r.product_id as string,
      quantity: r.quantity as number,
      priceSnapshot: r.price_snapshot as number,
      createdAt: new Date(r.created_at as string),
      productName: r.product_name as string,
      productSlug: r.product_slug as string,
      productImageUrl: (r.product_image_url as string) ?? null,
      currentStock: r.current_stock as number,
    }));

    return { ...cart, items };
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    priceSnapshot: number,
  ): Promise<CartItem> {
    const [row] = await db('cart_items')
      .insert({
        id: uuidv4(),
        cart_id: cartId,
        product_id: productId,
        quantity,
        price_snapshot: priceSnapshot,
      })
      .returning('*');
    await db('carts').where({ id: cartId }).update({ updated_at: new Date() });
    return this.toCartItem(row);
  }

  async findItem(cartId: string, productId: string): Promise<CartItem | null> {
    const row = await db('cart_items').where({ cart_id: cartId, product_id: productId }).first();
    return row ? this.toCartItem(row) : null;
  }

  async findItemById(itemId: string): Promise<CartItem | null> {
    const row = await db('cart_items').where({ id: itemId }).first();
    return row ? this.toCartItem(row) : null;
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const [row] = await db('cart_items').where({ id: itemId }).update({ quantity }).returning('*');
    return this.toCartItem(row);
  }

  async removeItem(itemId: string): Promise<void> {
    await db('cart_items').where({ id: itemId }).delete();
  }

  async clearItems(cartId: string): Promise<void> {
    await db('cart_items').where({ cart_id: cartId }).delete();
    await db('carts').where({ id: cartId }).update({ updated_at: new Date() });
  }
}
