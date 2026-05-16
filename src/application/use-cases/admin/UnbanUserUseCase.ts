import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AdminUserDTO } from '../../dtos/AdminDTO';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

export class UnbanUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(targetUserId: string, requesterId: string): Promise<AdminUserDTO> {
    if (targetUserId === requesterId) {
      throw new ForbiddenError('Cannot unban yourself');
    }
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundError('User');

    const unbanned = await this.userRepo.unban(targetUserId);
    return {
      id: unbanned.id,
      email: unbanned.email,
      name: unbanned.name,
      phone: unbanned.phone,
      role: unbanned.role,
      isBanned: unbanned.isBanned,
      createdAt: unbanned.createdAt,
    };
  }
}
