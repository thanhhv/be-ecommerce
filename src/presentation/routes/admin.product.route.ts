import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import { upload } from '../../infrastructure/storage/multerConfig';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/use-cases/product/DeleteProductUseCase';
import { CreateCategoryUseCase } from '../../application/use-cases/category/CreateCategoryUseCase';
import { authenticate } from '../middlewares/authenticate';
import { authorizeAdmin } from '../middlewares/authorizeAdmin';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
router.use(authenticate, authorizeAdmin);

const productRepo = new ProductRepository();
const categoryRepo = new CategoryRepository();
const storageService = new LocalStorageService();

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     tags: [Admin - Products]
 *     summary: Create a new product (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - basePrice
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *                 maxLength: 255
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               basePrice:
 *                 type: integer
 *                 minimum: 0
 *                 description: Price in VND
 *               salePrice:
 *                 type: integer
 *                 minimum: 0
 *                 description: Sale price in VND (optional)
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 product images
 *     responses:
 *       201:
 *         description: Product created
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
 */

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   put:
 *     tags: [Admin - Products]
 *     summary: Update a product (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *                 maxLength: 255
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               basePrice:
 *                 type: integer
 *                 minimum: 0
 *               salePrice:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
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
 *   delete:
 *     tags: [Admin - Products]
 *     summary: Soft delete a product (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/admin/categories:
 *   post:
 *     tags: [Admin - Products]
 *     summary: Create a new category (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID (optional)
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
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
 */

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  brand: z.string().max(255).optional(),
  categoryId: z.string().uuid(),
  basePrice: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  brand: z.string().max(255).optional(),
  categoryId: z.string().uuid().optional(),
  basePrice: z.coerce.number().int().min(0).optional(),
  salePrice: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  description: z.string().optional(),
});

router.post(
  '/products',
  upload.array('images', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid product data', parsed.error.errors);
      const useCase = new CreateProductUseCase(productRepo, categoryRepo, storageService);
      const files = (req.files as Express.Multer.File[]) ?? [];
      const product = await useCase.execute(parsed.data, files);
      res.status(201).json(ApiResponse.success(product, 'Product created'));
    } catch (err) {
      next(err);
    }
  },
);

router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid product data', parsed.error.errors);
    const useCase = new UpdateProductUseCase(productRepo);
    const product = await useCase.execute(req.params.id, parsed.data);
    res.json(ApiResponse.success(product, 'Product updated'));
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new DeleteProductUseCase(productRepo);
    await useCase.execute(req.params.id);
    res.json(ApiResponse.success(null, 'Product deleted'));
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid category data', parsed.error.errors);
    const useCase = new CreateCategoryUseCase(categoryRepo);
    const category = await useCase.execute(parsed.data);
    res.status(201).json(ApiResponse.success(category, 'Category created'));
  } catch (err) {
    next(err);
  }
});

export default router;
