import { v4 as uuidv4 } from 'uuid';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IStorageService } from '../../../infrastructure/storage/IStorageService';
import { Slug } from '../../../domain/value-objects/Slug';
import { CreateProductDTO, ProductDetailDTO } from '../../dtos/ProductDTO';
import { NotFoundError } from '../../../shared/errors/AppError';

export class CreateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository,
    private storageService: IStorageService,
  ) {}

  async execute(
    dto: CreateProductDTO,
    files: Express.Multer.File[],
    imageUrls: string[] = [],
  ): Promise<ProductDetailDTO> {
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) throw new NotFoundError('Category');

    let slug = Slug.from(dto.name).toString();
    const existing = await this.productRepo.findBySlug(slug);
    if (existing) {
      const suffix = Math.random().toString(36).slice(2, 6);
      slug = `${slug}-${suffix}`;
    }

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

    const fileImages = await Promise.all(
      files.map(async (file, idx) => ({
        id: uuidv4(),
        productId,
        url: await this.storageService.save(file),
        isPrimary: imageUrls.length === 0 && idx === 0,
        sortOrder: idx,
      })),
    );
    const urlImages = imageUrls.map((url, idx) => ({
      id: uuidv4(),
      productId,
      url,
      isPrimary: fileImages.length === 0 && idx === 0,
      sortOrder: fileImages.length + idx,
    }));
    const images = [...fileImages, ...urlImages];
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
