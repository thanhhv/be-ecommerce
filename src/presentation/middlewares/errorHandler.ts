import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../shared/errors/AppError';
import { ApiResponse } from '../../shared/response/ApiResponse';
import { logger } from '../../shared/logger/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    const details = err.details.map((d) =>
      typeof d === 'string' ? { message: d } : (d as { message: string }),
    );
    res.status(err.statusCode).json(ApiResponse.error(err.code, err.message, details));
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', { requestId: req.requestId, error: err });
    }
    res.status(err.statusCode).json(ApiResponse.error(err.code, err.message));
    return;
  }

  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json(ApiResponse.error('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
}
