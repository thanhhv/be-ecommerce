import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserProfileDTO } from '../../dtos/AuthDTO';
import { NotFoundError } from '../../../shared/errors/AppError';

export class GetProfileUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }
}
