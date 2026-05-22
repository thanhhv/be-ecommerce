import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

export class ListNotificationsUseCase {
  constructor(private notificationRepo: INotificationRepository) {}

  async execute(params: {
    cursor?: string;
    limit?: number;
  }): Promise<{ data: Notification[]; nextCursor: string | null }> {
    return this.notificationRepo.findAll({
      cursor: params.cursor,
      limit: params.limit ?? 5,
    });
  }
}
