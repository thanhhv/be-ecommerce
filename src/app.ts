import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';

import { requestIdMiddleware, requestLogger } from './presentation/middlewares/requestLogger';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { healthRouter } from './presentation/routes/health.route';
import authRouter from './presentation/routes/auth.route';
import userRouter from './presentation/routes/user.route';
import productRouter from './presentation/routes/product.route';
import categoryRouter from './presentation/routes/category.route';
import adminProductRouter from './presentation/routes/admin.product.route';
import cartRouter from './presentation/routes/cart.route';
import orderRouter from './presentation/routes/order.route';
import adminOrderRouter from './presentation/routes/admin.order.route';
import adminDashboardRouter from './presentation/routes/admin.dashboard.route';
import { ApiResponse } from './shared/response/ApiResponse';
import { configurePassport } from './infrastructure/auth/passport';

dotenv.config();
configurePassport();

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({ credentials: true, origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());

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
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/categories', categoryRouter);
  app.use('/api/v1/admin', adminProductRouter);
  app.use('/api/v1/admin', adminOrderRouter);
  app.use('/api/v1/admin', adminDashboardRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/orders', orderRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
}
