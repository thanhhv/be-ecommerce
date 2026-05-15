import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { requestIdMiddleware, requestLogger } from './presentation/middlewares/requestLogger';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { healthRouter } from './presentation/routes/health.route';
import { ApiResponse } from './shared/response/ApiResponse';

dotenv.config();

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(requestIdMiddleware);
  app.use(requestLogger);

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/v1', limiter);

  app.use('/api/v1/health', healthRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
}
