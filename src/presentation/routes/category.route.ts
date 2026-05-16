import { Router, Request, Response, NextFunction } from 'express';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { ListCategoriesUseCase } from '../../application/use-cases/category/ListCategoriesUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';

const router = Router();
const categoryRepo = new CategoryRepository();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new ListCategoriesUseCase(categoryRepo);
    const categories = await useCase.execute();
    res.json(ApiResponse.success(categories));
  } catch (err) {
    next(err);
  }
});

export default router;
