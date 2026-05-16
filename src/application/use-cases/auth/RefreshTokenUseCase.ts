import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { verifyRefreshToken, generateAccessToken } from '../../../infrastructure/auth/jwt';
import { UnauthorizedError } from '../../../shared/errors/AppError';

export class RefreshTokenUseCase {
  constructor(
    private tokenRepo: IRefreshTokenRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(rawToken: string): Promise<{ accessToken: string }> {
    let payload: { sub: string; jti: string };
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = await this.tokenRepo.findById(payload.jti);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) throw new UnauthorizedError('User not found');

    return { accessToken: generateAccessToken(user.id, user.role) };
  }
}
