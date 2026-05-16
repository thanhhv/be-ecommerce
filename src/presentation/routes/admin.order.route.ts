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

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
});

router.use(authenticate, authorizeAdmin);

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as OrderStatus | undefined;
    const useCase = new ListAllOrdersUseCase(orderRepo);
    const { data, total } = await useCase.execute({ status, page, limit });
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
