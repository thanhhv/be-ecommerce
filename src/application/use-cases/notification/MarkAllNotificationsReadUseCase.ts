import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';

export class MarkAllNotificationsReadUseCase {
  constructor(private notificationRepo: INotificationRepository) {}

  async execute(): Promise<void> {
    await this.notificationRepo.markAllRead();
  }
}
