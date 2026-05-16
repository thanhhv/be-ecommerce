import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/RefreshTokenRepository';
import { GoogleOAuthUseCase } from '../../application/use-cases/auth/GoogleOAuthUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';

const router = Router();
const userRepo = new UserRepository();
const tokenRepo = new RefreshTokenRepository();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new GoogleOAuthUseCase(userRepo, tokenRepo);
      const { dto, rawRefreshToken } = await useCase.execute(
        req.user as unknown as Parameters<typeof useCase.execute>[0],
      );
      res.cookie('refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
      res.json(ApiResponse.success(dto, 'Login successful'));
    } catch (err) {
      next(err);
    }
  },
);

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    if (!rawToken) {
      res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'No refresh token provided'));
      return;
    }
    const useCase = new RefreshTokenUseCase(tokenRepo, userRepo);
    const result = await useCase.execute(rawToken);
    res.json(ApiResponse.success(result, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    if (rawToken) {
      const useCase = new LogoutUseCase(tokenRepo);
      await useCase.execute(rawToken);
    }
    res.clearCookie('refresh_token');
    res.json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
});

export default router;
