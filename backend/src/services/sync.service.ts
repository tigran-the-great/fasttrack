import { Shipment, ShipmentStatus, SyncStatus } from '@prisma/client';
import pLimit from 'p-limit';
import { ShipmentRepository, shipmentRepository } from '../repositories/shipment.repository.js';
import { SyncLogRepository, syncLogRepository } from '../repositories/sync-log.repository.js';
import { CarrierClient, carrierClient } from '../external/carrier.client.js';
import { syncLockManager } from '../utils/mutex.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { NotFoundError, ExternalApiError } from '../utils/errors.js';
import type { SyncResultDto } from '../dtos/shipment.dto.js';
import type { ConflictResolution, CarrierShipmentResponse } from '../types/index.js';

export class SyncService {
  constructor(
    private readonly repository: ShipmentRepository = shipmentRepository,
    private readonly carrier: CarrierClient = carrierClient,
    private readonly syncLog: SyncLogRepository = syncLogRepository
  ) {}

  async syncAllShipments(): Promise<SyncResultDto> {
    const startTime = Date.now();

    return syncLockManager.withGlobalSyncLock(async () => {
      logger.info('Starting sync for all shipments');

      const shipments = await this.repository.findAllForSync();
      const errors: Array<{ shipmentId: string; error: string }> = [];

      const limit = pLimit(env.SYNC_CONCURRENCY);

      const syncPromises = shipments.map((shipment) =>
        limit(async () => {
          try {
            await this.syncSingleShipmentInternal(shipment);
            return { success: true, shipmentId: shipment.id };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to sync shipment', {
              shipmentId: shipment.id,
              error: errorMessage,
            });
            return { success: false, shipmentId: shipment.id, error: errorMessage };
          }
        })
      );

      const results = await Promise.all(syncPromises);

      let synced = 0;
      let failed = 0;

      for (const result of results) {
        if (result.success) {
          synced++;
        } else {
          failed++;
          errors.push({
            shipmentId: result.shipmentId,
            error: result.error || 'Unknown error',
          });
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Sync completed', {
        synced,
        failed,
        total: shipments.length,
        concurrency: env.SYNC_CONCURRENCY,
        duration,
      });

      const syncStatus: SyncStatus =
        failed === 0 ? 'SUCCESS' : synced === 0 ? 'FAILED' : 'PARTIAL';

      await this.syncLog.create({
        syncType: 'SCHEDULED',
        status: syncStatus,
        errorMessage: failed > 0 ? `${failed} shipment(s) failed to sync` : undefined,
        duration,
      });

      return { synced, failed, errors, duration };
    });
  }

  async syncSingleShipment(shipmentId: string): Promise<SyncResultDto> {
    const startTime = Date.now();

    const shipment = await this.repository.findById(shipmentId);

    if (!shipment) {
      throw new NotFoundError('Shipment', shipmentId);
    }

    return syncLockManager.withShipmentLock(shipmentId, async () => {
      try {
        await this.syncSingleShipmentInternal(shipment);
        const duration = Date.now() - startTime;

        await this.syncLog.create({
          shipmentId,
          syncType: 'MANUAL',
          status: 'SUCCESS',
          duration,
        });

        return {
          synced: 1,
          failed: 0,
          errors: [],
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await this.syncLog.create({
          shipmentId,
          syncType: 'MANUAL',
          status: 'FAILED',
          errorMessage,
          duration,
        });

        return {
          synced: 0,
          failed: 1,
          errors: [
            {
              shipmentId,
              error: errorMessage,
            },
          ],
          duration,
        };
      }
    });
  }

  private async syncSingleShipmentInternal(shipment: Shipment): Promise<void> {
    logger.debug('Syncing shipment', { shipmentId: shipment.id });

    if (!shipment.carrierRef) {
      const carrierResponse = await this.carrier.registerShipment({
        orderId: shipment.orderId,
        customerName: shipment.customerName,
        destination: shipment.destination,
        status: this.carrier.mapInternalStatusToCarrier(shipment.status),
      });

      await this.repository.updateWithSync(
        shipment.id,
        shipment.status,
        carrierResponse.id
      );

      logger.info('Shipment registered with carrier during sync', {
        shipmentId: shipment.id,
        carrierRef: carrierResponse.id,
      });

      return;
    }

    let carrierData;
    try {
      carrierData = await this.carrier.getShipmentStatus(shipment.carrierRef);
    } catch (error) {
      if (error instanceof ExternalApiError && error.isNotFound()) {
        logger.warn('Carrier shipment not found, re-registering', {
          shipmentId: shipment.id,
          staleCarrierRef: shipment.carrierRef,
        });

        const carrierResponse = await this.carrier.registerShipment({
          orderId: shipment.orderId,
          customerName: shipment.customerName,
          destination: shipment.destination,
          status: this.carrier.mapInternalStatusToCarrier(shipment.status),
        });

        await this.repository.updateWithSync(
          shipment.id,
          shipment.status,
          carrierResponse.id
        );

        logger.info('Shipment re-registered with carrier', {
          shipmentId: shipment.id,
          oldCarrierRef: shipment.carrierRef,
          newCarrierRef: carrierResponse.id,
        });

        return;
      }
      throw error;
    }

    const resolution = this.resolveConflict(shipment, carrierData);

    if (resolution.shouldUpdate) {
      await this.repository.updateWithSync(
        shipment.id,
        resolution.status as ShipmentStatus,
        shipment.carrierRef
      );

      logger.info('Shipment synced', {
        shipmentId: shipment.id,
        source: resolution.source,
        newStatus: resolution.status,
      });
    } else {
      await this.repository.updateWithSync(
        shipment.id,
        shipment.status,
        shipment.carrierRef
      );

      logger.debug('Shipment already up to date', { shipmentId: shipment.id });
    }

    if (resolution.shouldPushToCarrier && shipment.carrierRef) {
      try {
        await this.carrier.updateShipment(shipment.carrierRef, {
          status: this.carrier.mapInternalStatusToCarrier(shipment.status),
        });
        logger.info('Pushed local status to carrier', {
          shipmentId: shipment.id,
          status: shipment.status,
        });
      } catch (error) {
        logger.warn('Failed to push local status to carrier', {
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private resolveConflict(
    localShipment: Shipment,
    carrierData: CarrierShipmentResponse
  ): ConflictResolution {
    const carrierUpdatedAt = new Date(carrierData.updatedAt);
    const localUpdatedAt = localShipment.updatedAt;
    const carrierStatus = this.carrier.mapCarrierStatusToInternal(carrierData.status);

    if (carrierStatus === localShipment.status) {
      return {
        source: 'none',
        status: localShipment.status,
        shouldUpdate: false,
        shouldPushToCarrier: false,
      };
    }

    if (carrierUpdatedAt > localUpdatedAt) {
      return {
        source: 'carrier',
        status: carrierStatus,
        shouldUpdate: true,
        shouldPushToCarrier: false,
      };
    }

    if (localUpdatedAt > carrierUpdatedAt) {
      return {
        source: 'local',
        status: localShipment.status,
        shouldUpdate: false,
        shouldPushToCarrier: true,
      };
    }

    return {
      source: 'carrier',
      status: carrierStatus,
      shouldUpdate: true,
      shouldPushToCarrier: false,
    };
  }
}

export const syncService = new SyncService();
