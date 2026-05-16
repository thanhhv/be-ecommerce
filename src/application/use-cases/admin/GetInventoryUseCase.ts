import { db } from '../../../infrastructure/database/knex';
import { InventoryItemDTO } from '../../dtos/AdminDTO';

export class GetInventoryUseCase {
  async execute(page: number, limit: number): Promise<{ data: InventoryItemDTO[]; total: number }> {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('products').whereNull('deleted_at').count('id as count');
    const rows = await db('products')
      .whereNull('deleted_at')
      .orderBy('stock', 'asc')
      .limit(limit)
      .offset(offset)
      .select('id', 'name', 'slug', 'brand', 'stock', 'base_price', 'category_id', 'is_active');

    return {
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        slug: r.slug as string,
        brand: (r.brand as string) ?? null,
        stock: r.stock as number,
        basePrice: r.base_price as number,
        categoryId: r.category_id as string,
        isActive: r.is_active as boolean,
      })),
      total: Number(count),
    };
  }
}
