import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../infrastructure/database/knex';
import { AdjustStockDTO, InventoryItemDTO } from '../../dtos/AdminDTO';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';

export class AdjustStockUseCase {
  async execute(
    productId: string,
    adminId: string,
    dto: AdjustStockDTO,
  ): Promise<InventoryItemDTO> {
    const product = await db('products').where({ id: productId }).whereNull('deleted_at').first();
    if (!product) throw new NotFoundError('Product');

    const newStock = product.stock + dto.quantityChange;
    if (newStock < 0) {
      throw new ValidationError(
        `Adjustment would result in negative stock (current: ${product.stock})`,
      );
    }

    await db.transaction(async (trx) => {
      await trx('products')
        .where({ id: productId })
        .update({ stock: newStock, updated_at: new Date() });

      await trx('stock_adjustments').insert({
        id: uuidv4(),
        product_id: productId,
        admin_id: adminId,
        quantity_change: dto.quantityChange,
        reason: dto.reason,
      });
    });

    const updated = await db('products').where({ id: productId }).first();
    return {
      id: updated.id as string,
      name: updated.name as string,
      slug: updated.slug as string,
      brand: (updated.brand as string) ?? null,
      stock: updated.stock as number,
      basePrice: updated.base_price as number,
      categoryId: updated.category_id as string,
      isActive: updated.is_active as boolean,
    };
  }
}
