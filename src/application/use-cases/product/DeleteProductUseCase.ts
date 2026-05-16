import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { NotFoundError } from '../../../shared/errors/AppError';

export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.productRepo.findById(id);
    if (!existing) throw new NotFoundError('Product');
    await this.productRepo.softDelete(id);
  }
}
