import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { PlaceOrderUseCase } from '../../application/use-cases/order/PlaceOrderUseCase';
import { GetOrderUseCase } from '../../application/use-cases/order/GetOrderUseCase';
import { ListUserOrdersUseCase } from '../../application/use-cases/order/ListUserOrdersUseCase';
import { CancelOrderUseCase } from '../../application/use-cases/order/CancelOrderUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
const orderRepo = new OrderRepository();
const cartRepo = new CartRepository();
const productRepo = new ProductRepository();

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     description: Creates an order from the current user's cart, deducts stock, and clears the cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - shippingName
 *               - shippingPhone
 *               - shippingAddress
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, BANK_TRANSFER]
 *               shippingName:
 *                 type: string
 *                 maxLength: 255
 *               shippingPhone:
 *                 type: string
 *                 minLength: 9
 *                 maxLength: 15
 *               shippingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error or empty cart
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
 *   get:
 *     tags: [Orders]
 *     summary: List my orders
 *     description: Returns a paginated list of the authenticated user's orders
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated order list
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
 */

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order detail
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
 *     responses:
 *       200:
 *         description: Order detail
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
 *         description: Forbidden - order belongs to another user
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

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     description: Cancels an order if its status is PENDING
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
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Order cannot be cancelled (not in PENDING status)
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
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const placeOrderSchema = z.object({
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']),
  shippingName: z.string().min(1).max(255),
  shippingPhone: z.string().min(9).max(15),
  shippingAddress: z.string().min(1),
  notes: z.string().max(500).optional(),
});

router.use(authenticate);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid order data', parsed.error.errors);
    const useCase = new PlaceOrderUseCase(cartRepo, productRepo);
    const order = await useCase.execute(req.user!.id, parsed.data);
    res.status(201).json(ApiResponse.success(order, 'Order placed successfully'));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const useCase = new ListUserOrdersUseCase(orderRepo);
    const { data, total } = await useCase.execute(req.user!.id, page, limit);
    res.json(ApiResponse.paginated(data, total, page, limit));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetOrderUseCase(orderRepo);
    const order = await useCase.execute(req.params.id, req.user!.id, req.user!.role);
    res.json(ApiResponse.success(order));
  } catch (err) {
    next(err);
  }
});

router.put('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new CancelOrderUseCase(orderRepo);
    const order = await useCase.execute(req.params.id, req.user!.id, req.user!.role);
    res.json(ApiResponse.success(order, 'Order cancelled'));
  } catch (err) {
    next(err);
  }
});

export default router;
