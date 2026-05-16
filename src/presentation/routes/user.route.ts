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
