import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductDetailDTO, ProductListItemDTO } from '../../dtos/ProductDTO';
import { NotFoundError } from '../../../shared/errors/AppError';
import { Product } from '../../../domain/entities/Product';

export class GetProductDetailUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<ProductDetailDTO> {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product');

    const relatedRaw = await this.productRepo.findRelated(product.categoryId, product.id, 4);
    const related: ProductListItemDTO[] = await Promise.all(
      relatedRaw.map(async (p: Product) => {
        const img = await this.productRepo.findPrimaryImage(p.id);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          categoryId: p.categoryId,
          basePrice: p.basePrice,
          salePrice: p.salePrice,
          stock: p.stock,
          primaryImageUrl: img?.url ?? null,
        };
      }),
    );

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
      images: product.images,
      related,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
