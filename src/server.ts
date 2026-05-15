import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { checkDatabaseConnection } from './infrastructure/database/knex';
import { logger } from './shared/logger/logger';

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  try {
    await checkDatabaseConnection();
    logger.info('Database connection established');
  } catch (err) {
    logger.warn('Could not connect to database at startup — continuing anyway', {
      error: (err as Error).message,
    });
  }

  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV ?? 'development' });
  });
}

main().catch((err) => {
  logger.error('Fatal error during startup', { error: (err as Error).message });
  process.exit(1);
});
