import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { GetCartUseCase } from '../../application/use-cases/cart/GetCartUseCase';
import { AddToCartUseCase } from '../../application/use-cases/cart/AddToCartUseCase';
import { UpdateCartItemUseCase } from '../../application/use-cases/cart/UpdateCartItemUseCase';
import { RemoveCartItemUseCase } from '../../application/use-cases/cart/RemoveCartItemUseCase';
import { ClearCartUseCase } from '../../application/use-cases/cart/ClearCartUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
const cartRepo = new CartRepository();
const productRepo = new ProductRepository();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items and totals
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
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     description: Removes all items from the current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
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
 */

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item added to cart
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
 */

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart updated
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
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
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
 */

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetCartUseCase(cartRepo);
    const cart = await useCase.execute(req.user!.id);
    res.json(ApiResponse.success(cart));
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid cart item data', parsed.error.errors);
    const useCase = new AddToCartUseCase(cartRepo, productRepo);
    const cart = await useCase.execute(req.user!.id, parsed.data);
    res.status(201).json(ApiResponse.success(cart, 'Item added to cart'));
  } catch (err) {
    next(err);
  }
});

router.put('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid quantity', parsed.error.errors);
    const useCase = new UpdateCartItemUseCase(cartRepo, productRepo);
    const cart = await useCase.execute(req.user!.id, req.params.itemId, parsed.data);
    res.json(ApiResponse.success(cart, 'Cart updated'));
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new RemoveCartItemUseCase(cartRepo);
    const cart = await useCase.execute(req.user!.id, req.params.itemId);
    res.json(ApiResponse.success(cart, 'Item removed'));
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new ClearCartUseCase(cartRepo);
    await useCase.execute(req.user!.id);
    res.json(ApiResponse.success(null, 'Cart cleared'));
  } catch (err) {
    next(err);
  }
});

export default router;
