import { User } from '../entities/User';

export interface CreateUserData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  address?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByProviderId(provider: string, providerId: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  findAll(page: number, limit: number): Promise<{ data: User[]; total: number }>;
  ban(id: string): Promise<User>;
  unban(id: string): Promise<User>;
}
