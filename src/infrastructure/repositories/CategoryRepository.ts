import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/knex';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { Category } from '../../domain/entities/Category';

export class CategoryRepository implements ICategoryRepository {
  private toEntity(row: Record<string, unknown>): Category {
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      parentId: (row.parent_id as string) ?? null,
      description: (row.description as string) ?? null,
      createdAt: new Date(row.created_at as string),
    };
  }

  async findAll(): Promise<Category[]> {
    const rows = await db('categories').orderBy('name', 'asc').select('*');
    return rows.map((r: Record<string, unknown>) => this.toEntity(r));
  }

  async findById(id: string): Promise<Category | null> {
    const row = await db('categories').where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await db('categories').where({ slug }).first();
    return row ? this.toEntity(row) : null;
  }

  async create(data: {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    description?: string;
  }): Promise<Category> {
    const [row] = await db('categories')
      .insert({
        id: data.id || uuidv4(),
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId ?? null,
        description: data.description ?? null,
      })
      .returning('*');
    return this.toEntity(row);
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Category> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    const [row] = await db('categories').where({ id }).update(updateData).returning('*');
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await db('categories').where({ id }).delete();
  }
}
