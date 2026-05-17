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
import { UnbanUserUseCase } from '../../application/use-cases/admin/UnbanUserUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';
import { db } from '../../infrastructure/database/knex';

const router = Router();
const userRepo = new UserRepository();

/**
 * @swagger
 * /api/v1/admin/dashboard/stats:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get dashboard statistics (admin)
 *     description: Returns revenue, order counts, low stock alerts, and recent orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: integer
 *                           description: Total revenue in VND
 *                         ordersToday:
 *                           type: integer
 *                         lowStockAlerts:
 *                           type: integer
 *                         recentOrders:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/inventory:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: List inventory (admin)
 *     description: Returns paginated list of products with current stock levels
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated inventory list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/inventory/{productId}/adjust:
 *   put:
 *     tags: [Admin - Dashboard]
 *     summary: Adjust product stock (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantityChange
 *               - reason
 *             properties:
 *               quantityChange:
 *                 type: integer
 *                 description: Positive to add stock, negative to remove
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Stock adjusted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: List all users (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/users/{id}/ban:
 *   put:
 *     tags: [Admin - Dashboard]
 *     summary: Ban a user (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User banned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/users/{id}/unban:
 *   put:
 *     tags: [Admin - Dashboard]
 *     summary: Unban a user (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unbanned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only or cannot unban yourself
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/inventory/{productId}/history:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get stock adjustment history for a product (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated inventory history
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           quantityChange:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                           adminName:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/orders/export:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Export orders as CSV (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

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
    const q = req.query.q ? String(req.query.q) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const useCase = new ListUsersUseCase(userRepo);
    const { data, total } = await useCase.execute(page, limit, q, status);
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

router.put('/users/:id/unban', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new UnbanUserUseCase(userRepo);
    const user = await useCase.execute(req.params.id, req.user!.id);
    res.json(ApiResponse.success(user, 'User unbanned'));
  } catch (err) {
    next(err);
  }
});

// Inventory history
router.get(
  '/inventory/:productId/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const limit = Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20);
      const offset = (page - 1) * limit;

      const [{ count }] = await db('stock_adjustments')
        .where('product_id', req.params.productId)
        .count('id as count');

      const rows = await db('stock_adjustments as sa')
        .leftJoin('users as u', 'u.id', 'sa.admin_id')
        .where('sa.product_id', req.params.productId)
        .orderBy('sa.created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .select(
          'sa.id',
          'sa.quantity_change',
          'sa.reason',
          'u.name as admin_name',
          'sa.created_at',
        );

      const data = rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        quantityChange: r.quantity_change as number,
        reason: r.reason as string,
        adminName: (r.admin_name as string | null) ?? null,
        createdAt: new Date(r.created_at as string),
      }));

      res.json(ApiResponse.paginated(data, Number(count), page, limit));
    } catch (err) {
      next(err);
    }
  },
);

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
