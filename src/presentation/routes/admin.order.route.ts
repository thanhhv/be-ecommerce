import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { authorizeAdmin } from '../middlewares/authorizeAdmin';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { GetOrderUseCase } from '../../application/use-cases/order/GetOrderUseCase';
import { ListAllOrdersUseCase } from '../../application/use-cases/order/ListAllOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/order/UpdateOrderStatusUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';
import { OrderStatus } from '../../domain/entities/Order';

const router = Router();
const orderRepo = new OrderRepository();

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: List all orders (admin)
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Paginated list of all orders
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
 * /api/v1/admin/orders/{id}/status:
 *   put:
 *     tags: [Admin - Orders]
 *     summary: Update order status (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
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
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
});

router.use(authenticate, authorizeAdmin);

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as OrderStatus | undefined;
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const useCase = new ListAllOrdersUseCase(orderRepo);
    const { data, total } = await useCase.execute({ status, from, to, page, limit });
    res.json(ApiResponse.paginated(data, total, page, limit));
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetOrderUseCase(orderRepo);
    const order = await useCase.execute(req.params.id, req.user!.id, 'admin');
    res.json(ApiResponse.success(order));
  } catch (err) {
    next(err);
  }
});

router.put('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid status', parsed.error.errors);
    const useCase = new UpdateOrderStatusUseCase(orderRepo);
    const order = await useCase.execute(req.params.id, parsed.data.status);
    res.json(ApiResponse.success(order, 'Order status updated'));
  } catch (err) {
    next(err);
  }
});

export default router;
