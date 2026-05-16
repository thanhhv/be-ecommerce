import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { UpdateCartItemDTO, CartDTO } from '../../dtos/CartDTO';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/errors/AppError';
import { GetCartUseCase } from './GetCartUseCase';

export class UpdateCartItemUseCase {
  constructor(
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(userId: string, itemId: string, dto: UpdateCartItemDTO): Promise<CartDTO> {
    const item = await this.cartRepo.findItemById(itemId);
    if (!item) throw new NotFoundError('Cart item not found');

    const cart = await this.cartRepo.findOrCreateByUserId(userId);
    if (item.cartId !== cart.id) throw new ForbiddenError('Access denied');

    const product = await this.productRepo.findById(item.productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.stock < dto.quantity) {
      throw new ValidationError(`Only ${product.stock} items in stock`);
    }

    await this.cartRepo.updateItemQuantity(itemId, dto.quantity);
    return new GetCartUseCase(this.cartRepo).execute(userId);
  }
}
