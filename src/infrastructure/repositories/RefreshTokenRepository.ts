import { db } from '../database/knex';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: { id: string; userId: string; expiresAt: Date }): Promise<void> {
    await db('refresh_tokens').insert({
      id: data.id,
      user_id: data.userId,
      expires_at: data.expiresAt,
    });
  }

  async findById(id: string): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    const row = await db('refresh_tokens').where({ id }).first();
    if (!row) return null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      expiresAt: new Date(row.expires_at as string),
    };
  }

  async deleteById(id: string): Promise<void> {
    await db('refresh_tokens').where({ id }).delete();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db('refresh_tokens').where({ user_id: userId }).delete();
  }
}
