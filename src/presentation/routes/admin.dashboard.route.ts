import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { authorizeAdmin } from '../middlewares/authorizeAdmin';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { GetDashboardStatsUseCase } from '../../application/use-cases/admin/GetDashboardStatsUseCase';
import { GetInventoryUseCase } from '../../application/use-cases/admin/GetInventoryUseCase';
import { AdjustStockUseCase } from '../../application/use-cases/admin/AdjustStockUseCase';
import { ListUsersUseCase } from '../../application/use-cases/admin/ListUsersUseCase';
import { BanUserUseCase } from '../../application/use-cases/admin/BanUserUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';
import { db } from '../../infrastructure/database/knex';

const router = Router();
const userRepo = new UserRepository();

const adjustStockSchema = z.object({
  quantityChange: z.number().int(),
  reason: z.string().min(1).max(500),
});

router.use(authenticate, authorizeAdmin);

// Dashboard stats
router.get('/dashboard/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetDashboardStatsUseCase();
    const stats = await useCase.execute();
    res.json(ApiResponse.success(stats));
  } catch (err) {
    next(err);
  }
});

// Inventory
router.get('/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const useCase = new GetInventoryUseCase();
    const { data, total } = await useCase.execute(page, limit);
    res.json(ApiResponse.paginated(data, total, page, limit));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/inventory/:productId/adjust',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = adjustStockSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ValidationError('Invalid adjustment data', parsed.error.errors);
      const useCase = new AdjustStockUseCase();
      const result = await useCase.execute(req.params.productId, req.user!.id, parsed.data);
      res.json(ApiResponse.success(result, 'Stock adjusted'));
    } catch (err) {
      next(err);
    }
  },
);

// Users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const useCase = new ListUsersUseCase(userRepo);
    const { data, total } = await useCase.execute(page, limit);
    res.json(ApiResponse.paginated(data, total, page, limit));
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/ban', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new BanUserUseCase(userRepo);
    const user = await useCase.execute(req.params.id, req.user!.id);
    res.json(ApiResponse.success(user, 'User banned'));
  } catch (err) {
    next(err);
  }
});

// Orders CSV export
router.get('/orders/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await db('orders')
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'status',
        'payment_method',
        'subtotal',
        'shipping_fee',
        'total',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'created_at',
      );

    const header = 'ID,Status,Payment,Subtotal,Shipping Fee,Total,Name,Phone,Address,Created At';
    const rows = orders.map((o: Record<string, unknown>) =>
      [
        o.id,
        o.status,
        o.payment_method,
        o.subtotal,
        o.shipping_fee,
        o.total,
        `"${String(o.shipping_name).replace(/"/g, '""')}"`,
        o.shipping_phone,
        `"${String(o.shipping_address).replace(/"/g, '""')}"`,
        o.created_at,
      ].join(','),
    );

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
