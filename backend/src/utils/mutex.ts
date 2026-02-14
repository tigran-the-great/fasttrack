import { Mutex, MutexInterface } from 'async-mutex';
import { logger } from '../config/logger.js';
import { SyncInProgressError } from './errors.js';

class SyncLockManager {
  private globalSyncLock = new Mutex();
  private shipmentLocks = new Map<string, MutexInterface>();

  async withGlobalSyncLock<T>(fn: () => Promise<T>): Promise<T> {
    if (this.globalSyncLock.isLocked()) {
      logger.warn('Global sync lock already held, rejecting request');
      throw new SyncInProgressError();
    }

    const release = await this.globalSyncLock.acquire();
    logger.debug('Global sync lock acquired');

    try {
      return await fn();
    } finally {
      release();
      logger.debug('Global sync lock released');
    }
  }

  async withShipmentLock<T>(shipmentId: string, fn: () => Promise<T>): Promise<T> {
    if (!this.shipmentLocks.has(shipmentId)) {
      this.shipmentLocks.set(shipmentId, new Mutex());
    }

    const lock = this.shipmentLocks.get(shipmentId)!;
    const release = await lock.acquire();
    logger.debug('Shipment lock acquired', { shipmentId });

    try {
      return await fn();
    } finally {
      release();
      logger.debug('Shipment lock released', { shipmentId });

      if (!lock.isLocked()) {
        this.shipmentLocks.delete(shipmentId);
      }
    }
  }

  isGlobalSyncLocked(): boolean {
    return this.globalSyncLock.isLocked();
  }

  getLockedShipmentCount(): number {
    let count = 0;
    for (const lock of this.shipmentLocks.values()) {
      if (lock.isLocked()) count++;
    }
    return count;
  }

  cleanup(): void {
    for (const [id, mutex] of this.shipmentLocks.entries()) {
      if (!mutex.isLocked()) {
        this.shipmentLocks.delete(id);
      }
    }
  }
}

export const syncLockManager = new SyncLockManager();
