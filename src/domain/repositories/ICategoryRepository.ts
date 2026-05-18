import { Category } from '../entities/Category';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  create(data: {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    description?: string;
  }): Promise<Category>;
  update(id: string, data: { name?: string; description?: string }): Promise<Category>;
  delete(id: string): Promise<void>;
}
