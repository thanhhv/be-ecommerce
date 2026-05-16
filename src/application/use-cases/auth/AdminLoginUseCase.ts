import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError';

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  accessToken: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
  rawRefreshToken: string;
}

export class AdminLoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(input: AdminLoginInput): Promise<AdminLoginResult> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new ForbiddenError('Admin credentials not configured');
    }

    if (input.email !== adminEmail || input.password !== adminPassword) {
      throw new UnauthorizedError('Invalid admin credentials');
    }

    const user = await this.userRepo.findByEmail(input.email);
    if (!user || user.role !== 'admin') {
      throw new UnauthorizedError('Admin user not found');
    }

    const { token: rawRefreshToken, jti } = generateRefreshToken(user.id);
    await this.tokenRepo.create({
      id: jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: generateAccessToken(user.id, user.role),
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      rawRefreshToken,
    };
  }
}
