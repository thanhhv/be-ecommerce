import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderStatus } from '../../../domain/entities/Order';
import { OrderDTO } from '../../dtos/OrderDTO';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<OrderDTO> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updated = await this.orderRepo.updateStatus(orderId, newStatus);
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
