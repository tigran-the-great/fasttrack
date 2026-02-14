import { describe, it, expect } from '@jest/globals';
import { syncLockManager } from '../../src/utils/mutex.js';
import { SyncInProgressError } from '../../src/utils/errors.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SyncLockManager', () => {
  describe('withGlobalSyncLock', () => {
    it('should acquire and release global lock', async () => {
      let wasLocked = false;

      await syncLockManager.withGlobalSyncLock(async () => {
        wasLocked = syncLockManager.isGlobalSyncLocked();
        return 'result';
      });

      expect(wasLocked).toBe(true);
      expect(syncLockManager.isGlobalSyncLocked()).toBe(false);
    });

    it('should reject concurrent global sync operations', async () => {
      const firstOperation = syncLockManager.withGlobalSyncLock(async () => {
        await sleep(100);
        return 'first';
      });

      await sleep(10);

      await expect(
        syncLockManager.withGlobalSyncLock(async () => 'second')
      ).rejects.toThrow(SyncInProgressError);

      await firstOperation;
    });

    it('should release lock even on error', async () => {
      await expect(
        syncLockManager.withGlobalSyncLock(async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');

      expect(syncLockManager.isGlobalSyncLocked()).toBe(false);
    });
  });

  describe('withShipmentLock', () => {
    it('should acquire and release shipment lock', async () => {
      const shipmentId = 'test-shipment-1';

      const result = await syncLockManager.withShipmentLock(shipmentId, async () => {
        return 'locked operation';
      });

      expect(result).toBe('locked operation');
    });

    it('should allow concurrent locks on different shipments', async () => {
      const results: string[] = [];

      await Promise.all([
        syncLockManager.withShipmentLock('shipment-1', async () => {
          await sleep(50);
          results.push('shipment-1');
        }),
        syncLockManager.withShipmentLock('shipment-2', async () => {
          await sleep(10);
          results.push('shipment-2');
        }),
      ]);

      expect(results).toContain('shipment-1');
      expect(results).toContain('shipment-2');
    });

    it('should serialize operations on same shipment', async () => {
      const shipmentId = 'test-shipment-2';
      const order: number[] = [];

      const op1 = syncLockManager.withShipmentLock(shipmentId, async () => {
        await sleep(50);
        order.push(1);
      });

      const op2 = syncLockManager.withShipmentLock(shipmentId, async () => {
        order.push(2);
      });

      await Promise.all([op1, op2]);

      expect(order).toEqual([1, 2]);
    });

    it('should release lock on error', async () => {
      const shipmentId = 'test-shipment-3';

      await expect(
        syncLockManager.withShipmentLock(shipmentId, async () => {
          throw new Error('shipment error');
        })
      ).rejects.toThrow('shipment error');

      const result = await syncLockManager.withShipmentLock(shipmentId, async () => {
        return 'recovered';
      });

      expect(result).toBe('recovered');
    });
  });

  describe('getLockedShipmentCount', () => {
    it('should return correct count of locked shipments', async () => {
      expect(syncLockManager.getLockedShipmentCount()).toBe(0);

      const op1 = syncLockManager.withShipmentLock('count-test-1', async () => {
        await sleep(100);
      });

      await sleep(10);
      expect(syncLockManager.getLockedShipmentCount()).toBeGreaterThanOrEqual(1);

      await op1;
    });
  });
});
