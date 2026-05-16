import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderListItemDTO } from '../../dtos/OrderDTO';

export class ListUserOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: OrderListItemDTO[]; total: number }> {
    const { data, total } = await this.orderRepo.findByUserId(userId, page, limit);
    return {
      data: data.map((o) => ({
        id: o.id,
        status: o.status,
        paymentMethod: o.paymentMethod,
        total: o.total,
        itemCount: 0, // loaded without items for performance
        createdAt: o.createdAt,
      })),
      total,
    };
  }
}
