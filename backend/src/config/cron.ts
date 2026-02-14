import cron from 'node-cron';
import { env } from './env.js';
import { logger } from './logger.js';
import type { SyncService } from '../services/sync.service.js';

let scheduledTask: cron.ScheduledTask | null = null;

export const setupSyncScheduler = (syncService: SyncService): void => {
  if (!env.SYNC_ENABLED) {
    logger.info('Sync scheduler disabled');
    return;
  }

  if (!cron.validate(env.SYNC_CRON_SCHEDULE)) {
    logger.error('Invalid cron schedule', { schedule: env.SYNC_CRON_SCHEDULE });
    return;
  }

  scheduledTask = cron.schedule(
    env.SYNC_CRON_SCHEDULE,
    async () => {
      logger.info('Starting scheduled sync');
      try {
        const result = await syncService.syncAllShipments();
        logger.info('Scheduled sync completed', {
          synced: result.synced,
          failed: result.failed,
          duration: result.duration,
        });
      } catch (error) {
        logger.error('Scheduled sync failed', { error });
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  logger.info('Sync scheduler started', { schedule: env.SYNC_CRON_SCHEDULE });
};

export const stopSyncScheduler = (): void => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Sync scheduler stopped');
  }
};
