import { db } from '../../../infrastructure/database/knex';
import { DashboardStatsDTO } from '../../dtos/AdminDTO';

export class GetDashboardStatsUseCase {
  async execute(): Promise<DashboardStatsDTO> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenueResult] = await db('orders')
      .where('status', 'DELIVERED')
      .sum('total as total_revenue');

    const [revenueThisMonthResult] = await db('orders')
      .where('status', 'DELIVERED')
      .where('created_at', '>=', thisMonthStart)
      .sum('total as total_revenue');

    const [revenueLastMonthResult] = await db('orders')
      .where('status', 'DELIVERED')
      .where('created_at', '>=', lastMonthStart)
      .where('created_at', '<', lastMonthEnd)
      .sum('total as total_revenue');

    const [ordersTodayResult] = await db('orders')
      .where('created_at', '>=', todayStart)
      .count('id as count');

    const [usersResult] = await db('users').count('id as count');

    const [activeProductsResult] = await db('products')
      .where('is_active', true)
      .whereNull('deleted_at')
      .count('id as count');

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

    const revenueThisMonth = Number(revenueThisMonthResult.total_revenue ?? 0);
    const revenueLastMonth = Number(revenueLastMonthResult.total_revenue ?? 0);
    const revenueChangePercent =
      revenueLastMonth === 0
        ? 0
        : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 * 100) / 100;

    return {
      totalRevenue: Number(revenueResult.total_revenue ?? 0),
      totalRevenueThisMonth: revenueThisMonth,
      revenueChangePercent,
      ordersToday: Number(ordersTodayResult.count ?? 0),
      totalActiveProducts: Number(activeProductsResult.count ?? 0),
      totalUsers: Number(usersResult.count ?? 0),
      lowStockProducts: lowStockRows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        slug: r.slug as string,
        stock: r.stock as number,
      })),
      lowStockAlerts: lowStockRows.length,
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
