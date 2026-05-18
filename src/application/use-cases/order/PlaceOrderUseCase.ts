import { v4 as uuidv4 } from 'uuid';
import { CreateOrderItemData } from '../../../domain/repositories/IOrderRepository';
import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { PlaceOrderDTO, OrderDTO } from '../../dtos/OrderDTO';
import { ValidationError, NotFoundError } from '../../../shared/errors/AppError';
import { db } from '../../../infrastructure/database/knex';

const FREE_SHIPPING_THRESHOLD = 500_000;
const SHIPPING_FEE = 30_000;

export class PlaceOrderUseCase {
  constructor(
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(userId: string, dto: PlaceOrderDTO): Promise<OrderDTO> {
    const cart = await this.cartRepo.findWithItemsByUserId(userId);
    if (cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    // Validate stock and collect product data
    const productDataMap: Map<string, { price: number; name: string; imageUrl: string | null }> =
      new Map();

    for (const item of cart.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for "${product.name}": only ${product.stock} available`,
        );
      }
      const primaryImage = await this.productRepo.findPrimaryImage(product.id);
      productDataMap.set(item.productId, {
        price: item.priceSnapshot, // use snapshot from cart
        name: product.name,
        imageUrl: primaryImage?.url ?? null,
      });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + (productDataMap.get(item.productId)?.price ?? 0) * item.quantity,
      0,
    );
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    const orderId = uuidv4();
    const orderItems: CreateOrderItemData[] = cart.items.map((item) => {
      const pData = productDataMap.get(item.productId)!;
      return {
        id: uuidv4(),
        orderId,
        productId: item.productId,
        productNameSnapshot: pData.name,
        productImageSnapshot: pData.imageUrl,
        quantity: item.quantity,
        unitPrice: pData.price,
        totalPrice: pData.price * item.quantity,
      };
    });

    // Create order, deduct stock, clear cart — all in a transaction
    const order = await db.transaction(async (trx) => {
      // Create order + items (OrderRepository.create also runs a transaction inside,
      // so we call the DB directly here to use the same trx)
      const [orderRow] = await trx('orders')
        .insert({
          id: orderId,
          user_id: userId,
          payment_method: dto.paymentMethod,
          subtotal,
          shipping_fee: shippingFee,
          total,
          shipping_name: dto.shippingName,
          shipping_phone: dto.shippingPhone,
          shipping_address: dto.shippingAddress,
          notes: dto.notes ?? null,
        })
        .returning('*');

      if (orderItems.length > 0) {
        await trx('order_items').insert(
          orderItems.map((item) => ({
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

      // Deduct stock for each product
      for (const item of cart.items) {
        await trx('products').where('id', item.productId).decrement('stock', item.quantity);
      }

      // Clear cart items
      await trx('cart_items').where('cart_id', cart.id).delete();
      await trx('carts').where('id', cart.id).update({ updated_at: new Date() });

      const items = await trx('order_items').where({ order_id: orderId }).select('*');
      return {
        ...orderRow,
        userId: orderRow.user_id,
        status: orderRow.status,
        paymentMethod: orderRow.payment_method,
        shippingFee: orderRow.shipping_fee,
        shippingName: orderRow.shipping_name,
        shippingPhone: orderRow.shipping_phone,
        shippingAddress: orderRow.shipping_address,
        subtotal: orderRow.subtotal,
        total: orderRow.total,
        notes: orderRow.notes ?? null,
        createdAt: new Date(orderRow.created_at),
        updatedAt: new Date(orderRow.updated_at),
        items: items.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          orderId: r.order_id as string,
          productId: (r.product_id as string) ?? null,
          productNameSnapshot: r.product_name_snapshot as string,
          productImageSnapshot: (r.product_image_snapshot as string) ?? null,
          quantity: r.quantity as number,
          unitPrice: r.unit_price as number,
          totalPrice: r.total_price as number,
        })),
      };
    });

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      items: order.items.map(
        (i: {
          id: string;
          productId: string | null;
          productNameSnapshot: string;
          productImageSnapshot: string | null;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productNameSnapshot,
          productImage: i.productImageSnapshot,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.totalPrice,
        }),
      ),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
