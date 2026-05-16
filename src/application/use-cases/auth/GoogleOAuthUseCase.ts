import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/auth/jwt';
import { AuthResponseDTO } from '../../dtos/AuthDTO';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string }>;
  displayName: string;
  photos?: Array<{ value: string }>;
}

export class GoogleOAuthUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(
    profile: GoogleProfile,
  ): Promise<{ dto: AuthResponseDTO; rawRefreshToken: string }> {
    let user = await this.userRepo.findByProviderId('google', profile.id);
    if (!user) {
      user = await this.userRepo.create({
        id: uuidv4(),
        email: profile.emails[0].value,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value ?? null,
        provider: 'google',
        providerId: profile.id,
      });
    }

    const { token: rawRefreshToken, jti } = generateRefreshToken(user.id);
    await this.tokenRepo.create({
      id: jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      dto: {
        accessToken: generateAccessToken(user.id, user.role),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      },
      rawRefreshToken,
    };
  }
}
