import { v4 as uuidv4 } from 'uuid';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { Slug } from '../../../domain/value-objects/Slug';
import { CreateCategoryDTO, CategoryDTO } from '../../dtos/ProductDTO';
import { ConflictError } from '../../../shared/errors/AppError';

export class CreateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(dto: CreateCategoryDTO): Promise<CategoryDTO> {
    const slug = Slug.from(dto.name).toString();
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) throw new ConflictError('Category with this name already exists');

    const category = await this.categoryRepo.create({
      id: uuidv4(),
      name: dto.name,
      slug,
      parentId: dto.parentId,
      description: dto.description,
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      description: category.description,
    };
  }
}
