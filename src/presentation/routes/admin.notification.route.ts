import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorizeAdmin } from '../middlewares/authorizeAdmin';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { ListNotificationsUseCase } from '../../application/use-cases/notification/ListNotificationsUseCase';
import { GetUnreadCountUseCase } from '../../application/use-cases/notification/GetUnreadCountUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/notification/MarkNotificationReadUseCase';
import { MarkAllNotificationsReadUseCase } from '../../application/use-cases/notification/MarkAllNotificationsReadUseCase';
import { ApiResponse } from '../../shared/response/ApiResponse';

const router = Router();
const notificationRepo = new NotificationRepository();

router.use(authenticate, authorizeAdmin);

router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 5;
    const useCase = new ListNotificationsUseCase(notificationRepo);
    const result = await useCase.execute({ cursor, limit });
    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
});

router.get(
  '/notifications/unread-count',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new GetUnreadCountUseCase(notificationRepo);
      const count = await useCase.execute();
      res.json(ApiResponse.success({ count }));
    } catch (err) {
      next(err);
    }
  },
);

router.patch('/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const useCase = new MarkNotificationReadUseCase(notificationRepo);
    await useCase.execute(req.params.id);
    res.json(ApiResponse.success(null, 'Marked as read'));
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/notifications/read-all',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new MarkAllNotificationsReadUseCase(notificationRepo);
      await useCase.execute();
      res.json(ApiResponse.success(null, 'All notifications marked as read'));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
