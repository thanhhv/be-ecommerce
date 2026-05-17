import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/knex';
import {
  IUserRepository,
  CreateUserData,
  CreateLocalUserData,
  UpdateUserData,
} from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class UserRepository implements IUserRepository {
  private toEntity(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      name: (row.name as string) ?? null,
      phone: (row.phone as string) ?? null,
      address: (row.address as string) ?? null,
      avatarUrl: (row.avatar_url as string) ?? null,
      provider: row.provider as string,
      providerId: (row.provider_id as string) ?? null,
      role: row.role as 'user' | 'admin',
      isBanned: row.is_banned as boolean,
      passwordHash: (row.password_hash as string) ?? null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async findById(id: string): Promise<User | null> {
    const row = await db('users').where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await db('users').where({ email }).first();
    return row ? this.toEntity(row) : null;
  }

  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    const row = await db('users').where({ provider, provider_id: providerId }).first();
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const id = data.id || uuidv4();
    const [row] = await db('users')
      .insert({
        id,
        email: data.email,
        name: data.name,
        avatar_url: data.avatarUrl,
        provider: data.provider,
        provider_id: data.providerId,
        role: data.role || 'user',
      })
      .returning('*');
    return this.toEntity(row);
  }

  async createLocal(data: CreateLocalUserData): Promise<User> {
    const id = data.id || uuidv4();
    const [row] = await db('users')
      .insert({
        id,
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        address: data.address ?? null,
        password_hash: data.passwordHash,
        provider: 'local',
        provider_id: null,
        role: 'user',
        is_banned: false,
      })
      .returning('*');
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const [row] = await db('users')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return this.toEntity(row);
  }

  async findAll(
    page: number,
    limit: number,
    q?: string,
    status?: string,
  ): Promise<{ data: (User & { ordersCount: number })[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = db('users').whereNot('role', 'admin');
    let countQuery = db('users').whereNot('role', 'admin');

    if (q) {
      query = query.where((b) => b.whereILike('name', `%${q}%`).orWhereILike('email', `%${q}%`));
      countQuery = countQuery.where((b) =>
        b.whereILike('name', `%${q}%`).orWhereILike('email', `%${q}%`),
      );
    }
    if (status === 'BANNED') {
      query = query.where('is_banned', true);
      countQuery = countQuery.where('is_banned', true);
    } else if (status === 'ACTIVE') {
      query = query.where('is_banned', false);
      countQuery = countQuery.where('is_banned', false);
    }

    const [{ count }] = await countQuery.count('id as count');
    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select(
        'users.*',
        db.raw(
          '(SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id)::int AS orders_count',
        ),
      );

    return {
      data: rows.map((r: Record<string, unknown>) => ({
        ...this.toEntity(r),
        ordersCount: (r.orders_count as number) ?? 0,
      })),
      total: Number(count),
    };
  }

  async ban(id: string): Promise<User> {
    const [row] = await db('users')
      .where({ id })
      .update({ is_banned: true, updated_at: db.fn.now() })
      .returning('*');
    return this.toEntity(row);
  }

  async unban(id: string): Promise<User> {
    const [row] = await db('users')
      .where({ id })
      .update({ is_banned: false, updated_at: db.fn.now() })
      .returning('*');
    return this.toEntity(row);
  }
}
