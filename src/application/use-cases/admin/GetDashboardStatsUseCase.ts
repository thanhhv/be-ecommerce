import { db } from '../../../infrastructure/database/knex';
import { DashboardStatsDTO } from '../../dtos/AdminDTO';

export class GetDashboardStatsUseCase {
  async execute(): Promise<DashboardStatsDTO> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [revenueResult] = await db('orders')
      .where('status', 'DELIVERED')
      .sum('total as total_revenue');

    const [ordersTodayResult] = await db('orders')
      .where('created_at', '>=', todayStart)
      .count('id as count');

    const [usersResult] = await db('users').count('id as count');

    const lowStockRows = await db('products')
      .where('stock', '<=', 5)
      .where('is_active', true)
      .whereNull('deleted_at')
      .orderBy('stock', 'asc')
      .limit(10)
      .select('id', 'name', 'slug', 'stock');

    const recentOrderRows = await db('orders')
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'status', 'payment_method', 'total', 'created_at');

    return {
      totalRevenue: Number(revenueResult.total_revenue ?? 0),
      ordersToday: Number(ordersTodayResult.count ?? 0),
      totalUsers: Number(usersResult.count ?? 0),
      lowStockProducts: lowStockRows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        slug: r.slug as string,
        stock: r.stock as number,
      })),
      recentOrders: recentOrderRows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        status: r.status as DashboardStatsDTO['recentOrders'][0]['status'],
        paymentMethod: r.payment_method as DashboardStatsDTO['recentOrders'][0]['paymentMethod'],
        total: r.total as number,
        createdAt: new Date(r.created_at as string),
      })),
    };
  }
}
