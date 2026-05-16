import { v4 as uuidv4 } from 'uuid';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IStorageService } from '../../../infrastructure/storage/IStorageService';
import { Slug } from '../../../domain/value-objects/Slug';
import { CreateProductDTO, ProductDetailDTO } from '../../dtos/ProductDTO';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError';

export class CreateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository,
    private storageService: IStorageService,
  ) {}

  async execute(dto: CreateProductDTO, files: Express.Multer.File[]): Promise<ProductDetailDTO> {
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) throw new NotFoundError('Category');

    const slug = Slug.from(dto.name).toString();
    const existing = await this.productRepo.findBySlug(slug);
    if (existing) throw new ConflictError('A product with this name already exists');

    const productId = uuidv4();
    const product = await this.productRepo.create({
      id: productId,
      name: dto.name,
      slug,
      description: dto.description,
      brand: dto.brand,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
      salePrice: dto.salePrice,
      stock: dto.stock,
    });

    const images = await Promise.all(
      files.map(async (file, idx) => ({
        id: uuidv4(),
        productId,
        url: await this.storageService.save(file),
        isPrimary: idx === 0,
        sortOrder: idx,
      })),
    );
    if (images.length > 0) {
      await this.productRepo.addImages(images);
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      isActive: product.isActive,
      images,
      related: [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
