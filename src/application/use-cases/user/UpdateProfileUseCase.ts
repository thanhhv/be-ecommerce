import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserProfileDTO, UpdateProfileDTO } from '../../dtos/AuthDTO';
import { NotFoundError } from '../../../shared/errors/AppError';

export class UpdateProfileUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string, dto: UpdateProfileDTO): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User');
    const updated = await this.userRepo.update(userId, dto);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      avatarUrl: updated.avatarUrl,
      role: updated.role,
    };
  }
}
