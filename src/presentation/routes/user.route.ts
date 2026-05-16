import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { GetProfileUseCase } from '../../application/use-cases/user/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/user/UpdateProfileUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { ValidationError } from '../../shared/errors/AppError';

const router = Router();
const userRepo = new UserRepository();

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get my profile
 *     description: Returns the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         address:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         role:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     tags: [Users]
 *     summary: Update my profile
 *     description: Updates the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *               address:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new GetProfileUseCase(userRepo);
    const profile = await useCase.execute(req.user!.id);
    res.json(ApiResponse.success(profile));
  } catch (err) {
    next(err);
  }
});

router.put('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.errors);
    }
    const useCase = new UpdateProfileUseCase(userRepo);
    const profile = await useCase.execute(req.user!.id, parsed.data);
    res.json(ApiResponse.success(profile, 'Profile updated'));
  } catch (err) {
    next(err);
  }
});

export default router;
