import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../shared/errors/AppError';

export function authorizeAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
}
