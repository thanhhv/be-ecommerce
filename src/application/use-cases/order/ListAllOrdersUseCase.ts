import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderStatus } from '../../../domain/entities/Order';
import { OrderListItemDTO } from '../../dtos/OrderDTO';

export class ListAllOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(filter: {
    status?: OrderStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: OrderListItemDTO[]; total: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const { data, total } = await this.orderRepo.findAll({ ...filter, page, limit });
    return {
      data: data.map((o) => ({
        id: o.id,
        customerName: o.customerName ?? 'Unknown',
        status: o.status,
        paymentMethod: o.paymentMethod,
        total: o.total,
        itemCount: o.itemCount,
        createdAt: o.createdAt,
      })),
      total,
    };
  }
}
