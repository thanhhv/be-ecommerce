import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderDTO } from '../../dtos/OrderDTO';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/AppError';

export class CancelOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, userId: string, userRole: string): Promise<OrderDTO> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== userId && userRole !== 'admin') throw new ForbiddenError('Access denied');
    if (order.status !== 'PENDING') {
      throw new ValidationError('Only PENDING orders can be cancelled');
    }
    const updated = await this.orderRepo.updateStatus(orderId, 'CANCELLED');
    return {
      id: updated.id,
      userId: updated.userId,
      status: updated.status,
      paymentMethod: updated.paymentMethod,
      subtotal: updated.subtotal,
      shippingFee: updated.shippingFee,
      total: updated.total,
      shippingName: updated.shippingName,
      shippingPhone: updated.shippingPhone,
      shippingAddress: updated.shippingAddress,
      notes: updated.notes,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        productImageSnapshot: i.productImageSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
