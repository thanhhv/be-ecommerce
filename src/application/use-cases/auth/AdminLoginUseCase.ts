import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger/logger';

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
    logger.debug('[AdminLogin] attempt', { email: input.email });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error('[AdminLogin] ADMIN_EMAIL or ADMIN_PASSWORD not set in environment');
      throw new ForbiddenError('Admin credentials not configured');
    }

    if (input.email !== adminEmail || input.password !== adminPassword) {
      logger.warn('[AdminLogin] credential mismatch', {
        email: input.email,
        emailMatch: input.email === adminEmail,
        passwordMatch: input.password === adminPassword,
      });
      throw new UnauthorizedError('Invalid admin credentials');
    }

    logger.debug('[AdminLogin] credentials valid, looking up user in DB', { email: input.email });

    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      logger.warn('[AdminLogin] user not found in DB', { email: input.email });
      throw new UnauthorizedError('Admin user not found');
    }

    if (user.role !== 'admin') {
      logger.warn('[AdminLogin] user exists but role is not admin', {
        email: input.email,
        userId: user.id,
        role: user.role,
      });
      throw new UnauthorizedError('Admin user not found');
    }

    const { token: rawRefreshToken, jti } = generateRefreshToken(user.id);
    await this.tokenRepo.create({
      id: jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info('[AdminLogin] success', { userId: user.id, email: user.email });

    return {
      accessToken: generateAccessToken(user.id, user.role, '6h'),
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      rawRefreshToken,
    };
  }
}
