import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { CartDTO } from '../../dtos/CartDTO';

export class GetCartUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(userId: string): Promise<CartDTO> {
    const cart = await this.cartRepo.findWithItemsByUserId(userId);
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      productImageUrl: item.productImageUrl,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
      lineTotal: item.priceSnapshot * item.quantity,
      currentStock: item.currentStock,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { id: cart.id, userId: cart.userId, items, subtotal, itemCount };
  }
}
