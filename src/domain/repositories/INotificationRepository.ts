import { Notification } from '../entities/Notification';

export interface CreateNotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  refId?: string;
  refType?: string;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findAll(params: {
    cursor?: string;
    limit: number;
  }): Promise<{ data: Notification[]; nextCursor: string | null }>;
  getUnreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
