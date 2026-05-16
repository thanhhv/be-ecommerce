import { Router, Request, Response, NextFunction } from 'express';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { ListCategoriesUseCase } from '../../application/use-cases/category/ListCategoriesUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';

const router = Router();
const categoryRepo = new CategoryRepository();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     description: Returns all product categories
 *     responses:
 *       200:
 *         description: List of categories
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
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           parentId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           description:
 *                             type: string
 *                             nullable: true
 */
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
