import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';
import { CartDTO } from '../../dtos/CartDTO';
import { GetCartUseCase } from './GetCartUseCase';

export class RemoveCartItemUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(userId: string, itemId: string): Promise<CartDTO> {
    const item = await this.cartRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Cart item not found');

    const cart = await this.cartRepo.findOrCreateByUserId(userId);
    if (item.cartId !== cart.id) throw new ForbiddenError('Access denied');

    await this.cartRepo.removeItem(itemId);
    return new GetCartUseCase(this.cartRepo).execute(userId);
  }
}
