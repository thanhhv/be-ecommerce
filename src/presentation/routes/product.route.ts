import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { ListProductsUseCase } from '../../application/use-cases/product/ListProductsUseCase';
import { GetProductDetailUseCase } from '../../application/use-cases/product/GetProductDetailUseCase';
import { ListCategoriesUseCase } from '../../application/use-cases/category/ListCategoriesUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
const productRepo = new ProductRepository();
const categoryRepo = new CategoryRepository();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: List products with filters and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search by product name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum price (VND)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum price (VND)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, name]
 *         description: Sort order
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'name']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = productFilterSchema.safeParse(req.query);
    if (!parsed.success) throw new ValidationError('Invalid query params');
    const useCase = new ListProductsUseCase(productRepo);
    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 20;
    const { data, total } = await useCase.execute({ ...parsed.data, page, limit });
    res.json(ApiResponse.paginated(data, total, page, limit));
  } catch (err) {
    next(err);
  }
});

router.get('/categories/all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new ListCategoriesUseCase(categoryRepo);
    const categories = await useCase.execute();
    res.json(ApiResponse.success(categories));
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetProductDetailUseCase(productRepo);
    const product = await useCase.execute(req.params.slug);
    res.json(ApiResponse.success(product));
  } catch (err) {
    next(err);
  }
});

export default router;
