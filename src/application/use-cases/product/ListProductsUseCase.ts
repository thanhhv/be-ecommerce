import { IProductRepository, ProductFilter } from '../../../domain/repositories/IProductRepository';
import { ProductListItemDTO, ProductFilterDTO } from '../../dtos/ProductDTO';
import { Product } from '../../../domain/entities/Product';

export class ListProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(filter: ProductFilterDTO): Promise<{ data: ProductListItemDTO[]; total: number }> {
    const { data, total } = await this.productRepo.findMany(filter as ProductFilter);

    const items: ProductListItemDTO[] = await Promise.all(
      data.map(async (p: Product) => {
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

    return { data: items, total };
  }
}
