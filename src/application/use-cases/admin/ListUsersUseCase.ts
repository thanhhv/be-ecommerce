import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AdminUserDTO } from '../../dtos/AdminDTO';

export class ListUsersUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(page: number, limit: number): Promise<{ data: AdminUserDTO[]; total: number }> {
    const { data, total } = await this.userRepo.findAll(page, limit);
    return {
      data: data.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
      })),
      total,
    };
  }
}
