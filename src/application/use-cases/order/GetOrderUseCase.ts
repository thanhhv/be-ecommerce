import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderDTO } from '../../dtos/OrderDTO';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

export class GetOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, requesterId: string, requesterRole: string): Promise<OrderDTO> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenError('Access denied');
    }
    return {
      id: order.id,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productNameSnapshot,
        productImage: i.productImageSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.totalPrice,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
