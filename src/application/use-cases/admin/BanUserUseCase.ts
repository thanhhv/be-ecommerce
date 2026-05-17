import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AdminUserDTO } from '../../dtos/AdminDTO';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

export class BanUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(targetUserId: string, requesterId: string): Promise<AdminUserDTO> {
    if (targetUserId === requesterId) {
      throw new ForbiddenError('Cannot ban yourself');
    }
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundError('User');
    if (user.role === 'admin') throw new ForbiddenError('Cannot ban an admin user');

    const banned = await this.userRepo.ban(targetUserId);
    return {
      id: banned.id,
      email: banned.email,
      name: banned.name,
      phone: banned.phone,
      avatar: banned.avatarUrl ?? null,
      role: banned.role,
      status: 'BANNED',
      ordersCount: 0,
      createdAt: banned.createdAt,
    };
  }
}
