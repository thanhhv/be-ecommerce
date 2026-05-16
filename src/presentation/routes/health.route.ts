import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/ApiResponse';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() }, 'Healthy'));
});
