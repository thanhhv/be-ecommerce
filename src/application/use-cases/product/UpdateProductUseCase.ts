import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { UpdateProductDTO } from '../../dtos/ProductDTO';
import { NotFoundError } from '../../../shared/errors/AppError';
import { Product } from '../../../domain/entities/Product';

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO): Promise<Product> {
    const existing = await this.productRepo.findById(id);
    if (!existing) throw new NotFoundError('Product');
    return this.productRepo.update(id, dto);
  }
}
