import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger/logger';

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface UserLoginResult {
  accessToken: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    avatarUrl: string | null;
    role: string;
  };
  rawRefreshToken: string;
}

export class UserLoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(input: UserLoginInput): Promise<UserLoginResult> {
    logger.debug('[UserLogin] attempt', { email: input.email });

    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      logger.warn('[UserLogin] user not found', { email: input.email });
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    if (user.passwordHash === null) {
      logger.warn('[UserLogin] user has no password (Google account)', { email: input.email });
      throw new UnauthorizedError('Tài khoản này đăng nhập bằng Google. Vui lòng dùng Google.');
    }

    if (user.isBanned) {
      logger.warn('[UserLogin] user is banned', { userId: user.id, email: input.email });
      throw new ForbiddenError('Tài khoản đã bị khóa');
    }

    logger.debug('[UserLogin] comparing password', { userId: user.id });
    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      logger.warn('[UserLogin] password mismatch', { email: input.email });
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    const { token: rawRefreshToken, jti } = generateRefreshToken(user.id);
    await this.tokenRepo.create({
      id: jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info('[UserLogin] success', { userId: user.id, email: user.email });

    return {
      accessToken: generateAccessToken(user.id, user.role),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      rawRefreshToken,
    };
  }
}
