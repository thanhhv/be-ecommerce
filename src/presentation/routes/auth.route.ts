import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/RefreshTokenRepository';
import { GoogleOAuthUseCase } from '../../application/use-cases/auth/GoogleOAuthUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase';
import { AdminLoginUseCase } from '../../application/use-cases/auth/AdminLoginUseCase';
import { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase';
import { UserLoginUseCase } from '../../application/use-cases/auth/UserLoginUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
const userRepo = new UserRepository();
const tokenRepo = new RefreshTokenRepository();

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth2 login
 *     description: Redirects the user to Google for authentication
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth2 consent screen
 */

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth2 callback
 *     description: Handles the OAuth2 callback from Google, issues access token and sets refresh token cookie
 *     responses:
 *       200:
 *         description: Login successful, access token returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         user:
 *                           type: object
 *       302:
 *         description: Redirect on failure
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Uses the refresh_token cookie to issue a new access token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *       401:
 *         description: No refresh token provided or token invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     description: Revokes the refresh token and clears the refresh_token cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */

/**
 * @swagger
 * /api/v1/auth/admin/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin email+password login
 *     description: Authenticate as admin using ADMIN_EMAIL and ADMIN_PASSWORD env vars. Issues access token and sets refresh token cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh_token cookie (7d)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         admin:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                               nullable: true
 *                             email:
 *                               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Admin credentials not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

router.post('/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid login data', parsed.error.errors);
    const useCase = new AdminLoginUseCase(userRepo, tokenRepo);
    const { accessToken, admin, rawRefreshToken } = await useCase.execute(parsed.data);
    res.cookie('refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json(ApiResponse.success({ accessToken, admin }, 'Admin login successful'));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user with email and password
 *     description: Creates a local user account with email/password credentials. Returns access token and sets refresh token cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh_token cookie (7d)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             phone:
 *                               type: string
 *                               nullable: true
 *                             address:
 *                               type: string
 *                               nullable: true
 *                             role:
 *                               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Email already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ValidationError('Invalid registration data', parsed.error.errors);
    const useCase = new RegisterUseCase(userRepo, tokenRepo);
    const { accessToken, user, rawRefreshToken } = await useCase.execute(parsed.data);
    res.cookie('refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json(ApiResponse.success({ accessToken, user }, 'Registration successful'));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Authenticates a local user account. Returns access token and sets refresh token cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh_token cookie (7d)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                               nullable: true
 *                             email:
 *                               type: string
 *                             phone:
 *                               type: string
 *                               nullable: true
 *                             address:
 *                               type: string
 *                               nullable: true
 *                             avatarUrl:
 *                               type: string
 *                               nullable: true
 *                             role:
 *                               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Invalid credentials or Google account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Account is banned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = userLoginSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid login data', parsed.error.errors);
    const useCase = new UserLoginUseCase(userRepo, tokenRepo);
    const { accessToken, user, rawRefreshToken } = await useCase.execute(parsed.data);
    res.cookie('refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json(ApiResponse.success({ accessToken, user }, 'Login successful'));
  } catch (err) {
    next(err);
  }
});

export default router;
