import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AdminUserDTO } from '../../dtos/AdminDTO';

export class ListUsersUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(
    page: number,
    limit: number,
    q?: string,
    status?: string,
  ): Promise<{ data: AdminUserDTO[]; total: number }> {
    const { data, total } = await this.userRepo.findAll(page, limit, q, status);
    return {
      data: data.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        avatar: u.avatarUrl ?? null,
        role: u.role,
        status: u.isBanned ? 'BANNED' : 'ACTIVE',
        ordersCount: u.ordersCount,
        createdAt: u.createdAt,
      })),
      total,
    };
  }
}
