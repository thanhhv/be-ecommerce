export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string | null;
  role: UserRole;
  isBanned: boolean;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
