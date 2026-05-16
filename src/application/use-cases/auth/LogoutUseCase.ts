import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { verifyRefreshToken } from '../../../infrastructure/auth/jwt';

export class LogoutUseCase {
  constructor(private tokenRepo: IRefreshTokenRepository) {}

  async execute(rawToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(rawToken);
      await this.tokenRepo.deleteById(payload.jti);
    } catch {
      // token already expired or invalid — treat as already logged out
    }
  }
}
