export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string;
  role: UserRole;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
