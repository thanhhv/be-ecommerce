import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';

export class GetUnreadCountUseCase {
  constructor(private notificationRepo: INotificationRepository) {}

  async execute(): Promise<number> {
    return this.notificationRepo.getUnreadCount();
  }
}
