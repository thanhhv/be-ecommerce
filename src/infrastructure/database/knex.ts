import knex from 'knex';
import { knexConfig } from './knexConfig';

const env = (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production';

export const db = knex(knexConfig[env]);

export async function checkDatabaseConnection(): Promise<void> {
  await db.raw('SELECT 1');
}
