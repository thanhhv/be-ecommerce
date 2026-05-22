import { v4 as uuidv4 } from 'uuid';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

export class CreateNotificationUseCase {
  constructor(private notificationRepo: INotificationRepository) {}

  async execute(params: {
    type: string;
    title: string;
    body: string;
    refId?: string;
    refType?: string;
  }): Promise<Notification> {
    return this.notificationRepo.create({
      id: uuidv4(),
      ...params,
    });
  }
}
