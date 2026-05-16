import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { CategoryDTO } from '../../dtos/ProductDTO';

export class ListCategoriesUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(): Promise<CategoryDTO[]> {
    const categories = await this.categoryRepo.findAll();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      description: c.description,
    }));
  }
}
