import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { setupSyncScheduler, stopSyncScheduler } from './config/cron.js';
import { syncService } from './services/sync.service.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    setupSyncScheduler(syncService);

    const server = app.listen(env.PORT, () => {
      logger.info(`Server started`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        syncEnabled: env.SYNC_ENABLED,
        syncSchedule: env.SYNC_CRON_SCHEDULE,
      });
    });

    server.keepAliveTimeout = env.SERVER_KEEP_ALIVE_TIMEOUT;
    server.headersTimeout = env.SERVER_HEADERS_TIMEOUT;

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      stopSyncScheduler();

      server.close(async () => {
        logger.info('HTTP server closed');

        await disconnectDatabase();

        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, env.GRACEFUL_SHUTDOWN_TIMEOUT);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
