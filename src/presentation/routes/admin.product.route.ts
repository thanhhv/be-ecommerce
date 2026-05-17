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
import { ValidationError, NotFoundError } from '../../shared/errors/AppError';

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

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
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
      const rawUrls = req.body.imageUrls;
      const imageUrls: string[] = Array.isArray(rawUrls) ? rawUrls : rawUrls ? [rawUrls] : [];
      const product = await useCase.execute(parsed.data, files, imageUrls);
      res.status(201).json(ApiResponse.success(product, 'Product created'));
    } catch (err) {
      next(err);
    }
  },
);

router.put('/products/:id/images', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productRepo.findById(req.params.id);
    if (!product) throw new NotFoundError('Product');
    const urls: string[] = req.body.urls ?? [];
    await productRepo.deleteImages(req.params.id);
    if (urls.length > 0) {
      const { v4: uuidv4 } = await import('uuid');
      await productRepo.addImages(
        urls.map((url: string, idx: number) => ({
          id: uuidv4(),
          productId: req.params.id,
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      );
    }
    res.json(ApiResponse.success(null, 'Images updated'));
  } catch (err) {
    next(err);
  }
});

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

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     tags: [Admin - Products]
 *     summary: List all products for admin (including inactive, excluding soft-deleted)
 *     security:
 *       - bearerAuth: []
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name (ILIKE)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by active status (omit to return both)
 *     responses:
 *       200:
 *         description: Paginated product list
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
 */
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20);
    const search = req.query.search ? String(req.query.search) : undefined;
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    let isActive: boolean | undefined;
    if (req.query.isActive === 'true') isActive = true;
    else if (req.query.isActive === 'false') isActive = false;

    const { data, total } = await productRepo.findManyAdmin({
      page,
      limit,
      search,
      categoryId,
      isActive,
    });
    res.json(ApiResponse.paginated(data, total, page, limit, 'Products retrieved'));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   get:
 *     tags: [Admin - Products]
 *     summary: Get single product with images by ID (for edit form)
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
 *         description: Product with images
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
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productRepo.findByIdWithImages(req.params.id);
    if (!product) throw new NotFoundError('Product');
    res.json(ApiResponse.success(product, 'Product retrieved'));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   put:
 *     tags: [Admin - Products]
 *     summary: Update a category (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
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
 *     responses:
 *       200:
 *         description: Category updated
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     tags: [Admin - Products]
 *     summary: Delete a category (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid category data', parsed.error.errors);
    const existing = await categoryRepo.findById(req.params.id);
    if (!existing) throw new NotFoundError('Category');
    const category = await categoryRepo.update(req.params.id, parsed.data);
    res.json(ApiResponse.success(category, 'Category updated'));
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await categoryRepo.findById(req.params.id);
    if (!existing) throw new NotFoundError('Category');
    await categoryRepo.delete(req.params.id);
    res.json(ApiResponse.success({ success: true }, 'Category deleted'));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/admin/upload/image:
 *   post:
 *     tags: [Admin - Products]
 *     summary: Upload a single image (admin)
 *     description: Uploads a single image file and returns the public URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or WebP, max 5 MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                         url:
 *                           type: string
 *                           description: Public URL of the uploaded image
 *       400:
 *         description: No file provided or invalid file type
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
router.post(
  '/upload/image',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        throw new NotFoundError('No image file provided');
      }
      const url = await storageService.save(file);
      res.json(ApiResponse.success({ url }, 'Image uploaded'));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
