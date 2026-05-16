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
