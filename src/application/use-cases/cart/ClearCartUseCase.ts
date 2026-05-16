import { ICartRepository } from '../../../domain/repositories/ICartRepository';

export class ClearCartUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(userId: string): Promise<void> {
    const cart = await this.cartRepo.findOrCreateByUserId(userId);
    await this.cartRepo.clearItems(cart.id);
  }
}
