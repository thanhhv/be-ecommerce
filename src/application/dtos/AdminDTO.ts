import { OrderStatus } from '../../domain/entities/Order';
import { PaymentMethod } from '../../domain/entities/Order';

export interface DashboardStatsDTO {
  totalRevenue: number;
  totalRevenueThisMonth: number;
  revenueChangePercent: number;
  ordersToday: number;
  totalActiveProducts: number;
  totalUsers: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
  }>;
  lowStockAlerts: number;
  recentOrders: Array<{
    id: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    total: number;
    createdAt: Date;
  }>;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  stock: number;
  basePrice: number;
  categoryId: string;
  isActive: boolean;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isBanned: boolean;
  createdAt: Date;
}

export interface AdjustStockDTO {
  quantityChange: number;
  reason: string;
}
