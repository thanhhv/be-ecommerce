export interface IRefreshTokenRepository {
  create(data: { id: string; userId: string; expiresAt: Date }): Promise<void>;
  findById(id: string): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
