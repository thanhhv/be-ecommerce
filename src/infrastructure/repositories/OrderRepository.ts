import { db } from '../database/knex';
import {
  IOrderRepository,
  OrderWithItems,
  CreateOrderData,
  CreateOrderItemData,
  OrderFilter,
} from '../../domain/repositories/IOrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';

export class OrderRepository implements IOrderRepository {
  private toOrder(row: Record<string, unknown>): Order {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      status: row.status as OrderStatus,
      paymentMethod: row.payment_method as 'COD' | 'BANK_TRANSFER',
      subtotal: row.subtotal as number,
      shippingFee: row.shipping_fee as number,
      total: row.total as number,
      shippingName: row.shipping_name as string,
      shippingPhone: row.shipping_phone as string,
      shippingAddress: row.shipping_address as string,
      notes: (row.notes as string) ?? null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private toOrderItem(row: Record<string, unknown>): OrderItem {
    return {
      id: row.id as string,
      orderId: row.order_id as string,
      productId: (row.product_id as string) ?? null,
      productNameSnapshot: row.product_name_snapshot as string,
      productImageSnapshot: (row.product_image_snapshot as string) ?? null,
      quantity: row.quantity as number,
      unitPrice: row.unit_price as number,
      totalPrice: row.total_price as number,
    };
  }

  async create(data: CreateOrderData, items: CreateOrderItemData[]): Promise<OrderWithItems> {
    return db.transaction(async (trx) => {
      const [orderRow] = await trx('orders')
        .insert({
          id: data.id,
          user_id: data.userId,
          payment_method: data.paymentMethod,
          subtotal: data.subtotal,
          shipping_fee: data.shippingFee,
          total: data.total,
          shipping_name: data.shippingName,
          shipping_phone: data.shippingPhone,
          shipping_address: data.shippingAddress,
          notes: data.notes ?? null,
        })
        .returning('*');

      if (items.length > 0) {
        await trx('order_items').insert(
          items.map((item) => ({
            id: item.id,
            order_id: item.orderId,
            product_id: item.productId,
            product_name_snapshot: item.productNameSnapshot,
            product_image_snapshot: item.productImageSnapshot,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
          })),
        );
      }

      const orderItems = await trx('order_items').where({ order_id: data.id }).select('*');
      return {
        ...this.toOrder(orderRow),
        items: orderItems.map((r: Record<string, unknown>) => this.toOrderItem(r)),
      };
    });
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const row = await db('orders').where({ id }).first();
    if (!row) return null;
    const items = await db('order_items').where({ order_id: id }).select('*');
    return {
      ...this.toOrder(row),
      items: items.map((r: Record<string, unknown>) => this.toOrderItem(r)),
    };
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('orders').where({ user_id: userId }).count('id as count');
    const rows = await db('orders')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*');
    return {
      data: rows.map((r: Record<string, unknown>) => this.toOrder(r)),
      total: Number(count),
    };
  }

  async findAll(filter: OrderFilter): Promise<{ data: Order[]; total: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = db('orders');
    let countQuery = db('orders');

    if (filter.userId) {
      query = query.where('user_id', filter.userId);
      countQuery = countQuery.where('user_id', filter.userId);
    }
    if (filter.status) {
      query = query.where('status', filter.status);
      countQuery = countQuery.where('status', filter.status);
    }

    const [{ count }] = await countQuery.count('id as count');
    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset).select('*');

    return {
      data: rows.map((r: Record<string, unknown>) => this.toOrder(r)),
      total: Number(count),
    };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const [row] = await db('orders')
      .where({ id })
      .update({ status, updated_at: new Date() })
      .returning('*');
    return this.toOrder(row);
  }
}
