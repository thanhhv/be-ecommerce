export type NotificationType = 'NEW_ORDER';
export type NotificationRefType = 'ORDER';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  refId: string | null;
  refType: NotificationRefType | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
