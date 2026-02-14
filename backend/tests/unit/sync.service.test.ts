import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SyncService } from '../../src/services/sync.service.js';
import { ShipmentRepository } from '../../src/repositories/shipment.repository.js';
import { SyncLogRepository } from '../../src/repositories/sync-log.repository.js';
import { CarrierClient } from '../../src/external/carrier.client.js';
import { NotFoundError } from '../../src/utils/errors.js';
import type { Shipment, ShipmentStatus, SyncLog } from '@prisma/client';

const createMockShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  orderId: 'ORD-001',
  customerName: 'John Doe',
  destination: '123 Main St',
  status: 'PENDING' as ShipmentStatus,
  lastSyncedAt: null,
  carrierRef: 'carrier-123',
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SyncService', () => {
  let service: SyncService;
  let mockRepository: jest.Mocked<ShipmentRepository>;
  let mockCarrier: jest.Mocked<CarrierClient>;
  let mockSyncLog: jest.Mocked<SyncLogRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAllForSync: jest.fn(),
      updateWithSync: jest.fn(),
      updateCarrierRef: jest.fn(),
    } as unknown as jest.Mocked<ShipmentRepository>;

    mockCarrier = {
      registerShipment: jest.fn(),
      updateShipment: jest.fn(),
      getShipmentStatus: jest.fn(),
      mapInternalStatusToCarrier: jest.fn().mockReturnValue('pending'),
      mapCarrierStatusToInternal: jest.fn().mockReturnValue('PENDING'),
    } as unknown as jest.Mocked<CarrierClient>;

    mockSyncLog = {
      create: jest.fn<() => Promise<SyncLog>>().mockResolvedValue({} as SyncLog),
      findAll: jest.fn(),
      findByShipmentId: jest.fn(),
    } as unknown as jest.Mocked<SyncLogRepository>;

    service = new SyncService(mockRepository, mockCarrier, mockSyncLog);
  });

  describe('syncSingleShipment', () => {
    it('should sync a single shipment successfully', async () => {
      const mockShipment = createMockShipment();
      mockRepository.findById.mockResolvedValue(mockShipment);
      mockCarrier.getShipmentStatus.mockResolvedValue({
        id: 'carrier-123',
        orderId: 'ORD-001',
        status: 'in_transit',
        updatedAt: new Date(Date.now() + 1000).toISOString(),
      });
      mockCarrier.mapCarrierStatusToInternal.mockReturnValue('IN_TRANSIT');
      mockRepository.updateWithSync.mockResolvedValue({
        ...mockShipment,
        status: 'IN_TRANSIT' as ShipmentStatus,
      });

      const result = await service.syncSingleShipment(mockShipment.id);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw NotFoundError for non-existent shipment', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.syncSingleShipment('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should register new shipment with carrier if no carrierRef', async () => {
      const mockShipment = createMockShipment({ carrierRef: null });
      mockRepository.findById.mockResolvedValue(mockShipment);
      mockCarrier.registerShipment.mockResolvedValue({
        id: 'new-carrier-ref',
        orderId: 'ORD-001',
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });
      mockRepository.updateWithSync.mockResolvedValue({
        ...mockShipment,
        carrierRef: 'new-carrier-ref',
      });

      const result = await service.syncSingleShipment(mockShipment.id);

      expect(result.synced).toBe(1);
      expect(mockCarrier.registerShipment).toHaveBeenCalled();
    });

    it('should return failed result on sync error', async () => {
      const mockShipment = createMockShipment();
      mockRepository.findById.mockResolvedValue(mockShipment);
      mockCarrier.getShipmentStatus.mockRejectedValue(new Error('Carrier unavailable'));

      const result = await service.syncSingleShipment(mockShipment.id);

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('syncAllShipments', () => {
    it('should sync all shipments successfully', async () => {
      const shipments = [
        createMockShipment({ id: 'ship-1' }),
        createMockShipment({ id: 'ship-2', orderId: 'ORD-002' }),
      ];

      mockRepository.findAllForSync.mockResolvedValue(shipments);
      mockCarrier.getShipmentStatus.mockResolvedValue({
        id: 'carrier-123',
        orderId: 'ORD-001',
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });
      mockRepository.updateWithSync.mockImplementation(async (id) =>
        shipments.find((s) => s.id === id)!
      );

      const result = await service.syncAllShipments();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should continue syncing after individual failure', async () => {
      const shipments = [
        createMockShipment({ id: 'ship-1' }),
        createMockShipment({ id: 'ship-2', orderId: 'ORD-002' }),
      ];

      mockRepository.findAllForSync.mockResolvedValue(shipments);
      mockCarrier.getShipmentStatus
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          id: 'carrier-123',
          orderId: 'ORD-002',
          status: 'pending',
          updatedAt: new Date().toISOString(),
        });
      mockRepository.updateWithSync.mockImplementation(async (id) =>
        shipments.find((s) => s.id === id)!
      );

      const result = await service.syncAllShipments();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should return empty result when no shipments to sync', async () => {
      mockRepository.findAllForSync.mockResolvedValue([]);

      const result = await service.syncAllShipments();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
