import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/auth/jwt';
import { ConflictError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger/logger';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
}

export interface RegisterResult {
  accessToken: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    role: string;
  };
  rawRefreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    logger.debug('[Register] attempt', { email: input.email });

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      logger.warn('[Register] email already taken', { email: input.email });
      throw new ConflictError('Email đã được sử dụng');
    }

    logger.debug('[Register] hashing password', { email: input.email });
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.userRepo.createLocal({
      id: uuidv4(),
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone ?? null,
      address: input.address ?? null,
    });

    logger.debug('[Register] user created, generating tokens', { userId: user.id });

    const { token: rawRefreshToken, jti } = generateRefreshToken(user.id);
    await this.tokenRepo.create({
      id: jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info('[Register] success', { userId: user.id, email: user.email });

    return {
      accessToken: generateAccessToken(user.id, user.role),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      rawRefreshToken,
    };
  }
}
