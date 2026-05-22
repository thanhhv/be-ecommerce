import { db } from '../database/knex';
import {
  INotificationRepository,
  CreateNotificationData,
} from '../../domain/repositories/INotificationRepository';
import {
  Notification,
  NotificationType,
  NotificationRefType,
} from '../../domain/entities/Notification';

export class NotificationRepository implements INotificationRepository {
  private toNotification(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      type: row.type as NotificationType,
      title: row.title as string,
      body: row.body as string,
      refId: (row.ref_id as string) ?? null,
      refType: (row.ref_type as NotificationRefType) ?? null,
      isRead: row.is_read as boolean,
      readAt: row.read_at ? new Date(row.read_at as string) : null,
      createdAt: new Date(row.created_at as string),
    };
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const [row] = await db('admin_notifications')
      .insert({
        id: data.id,
        type: data.type,
        title: data.title,
        body: data.body,
        ref_id: data.refId ?? null,
        ref_type: data.refType ?? null,
      })
      .returning('*');
    return this.toNotification(row);
  }

  async findAll(params: {
    cursor?: string;
    limit: number;
  }): Promise<{ data: Notification[]; nextCursor: string | null }> {
    let query = db('admin_notifications')
      .orderBy('created_at', 'desc')
      .limit(params.limit + 1);

    if (params.cursor) {
      const cursorRow = await db('admin_notifications').where('id', params.cursor).first();
      if (cursorRow) {
        query = query.where('created_at', '<', cursorRow.created_at);
      }
    }

    const rows = await query.select('*');
    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? (data[data.length - 1].id as string) : null;

    return {
      data: data.map((r: Record<string, unknown>) => this.toNotification(r)),
      nextCursor,
    };
  }

  async getUnreadCount(): Promise<number> {
    const [{ count }] = await db('admin_notifications')
      .where('is_read', false)
      .count('id as count');
    return Number(count);
  }

  async markRead(id: string): Promise<void> {
    await db('admin_notifications')
      .where({ id, is_read: false })
      .update({ is_read: true, read_at: new Date() });
  }

  async markAllRead(): Promise<void> {
    await db('admin_notifications')
      .where('is_read', false)
      .update({ is_read: true, read_at: new Date() });
  }
}
