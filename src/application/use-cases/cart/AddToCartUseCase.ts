import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { AddToCartDTO, CartDTO } from '../../dtos/CartDTO';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { GetCartUseCase } from './GetCartUseCase';

export class AddToCartUseCase {
  constructor(
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository,
  ) {}

  async execute(userId: string, dto: AddToCartDTO): Promise<CartDTO> {
    const product = await this.productRepo.findById(dto.productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.stock < dto.quantity) {
      throw new ValidationError(`Only ${product.stock} items in stock`);
    }

    const cart = await this.cartRepo.findOrCreateByUserId(userId);
    const existing = await this.cartRepo.findItem(cart.id, dto.productId);

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (product.stock < newQty) {
        throw new ValidationError(`Only ${product.stock} items in stock`);
      }
      await this.cartRepo.updateItemQuantity(existing.id, newQty);
    } else {
      const price = product.salePrice ?? product.basePrice;
      await this.cartRepo.addItem(cart.id, dto.productId, dto.quantity, price);
    }

    return new GetCartUseCase(this.cartRepo).execute(userId);
  }
}
