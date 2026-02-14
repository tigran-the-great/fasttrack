import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ShipmentRepository } from '../../src/repositories/shipment.repository.js';
import type { ShipmentStatus } from '../../src/dtos/shipment.dto.js';

const mockPrisma = {
  shipment: {
    findMany: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    count: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    updateMany: jest.fn<any>(),
    delete: jest.fn<any>(),
  },
};

describe('ShipmentRepository', () => {
  let repository: ShipmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ShipmentRepository(mockPrisma as any);
  });

  describe('findAll', () => {
    it('should return paginated shipments', async () => {
      const mockShipments = [
        { id: '1', orderId: 'ORD-001', status: 'PENDING' },
        { id: '2', orderId: 'ORD-002', status: 'IN_TRANSIT' },
      ];
      mockPrisma.shipment.findMany.mockResolvedValue(mockShipments);
      mockPrisma.shipment.count.mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.shipments).toEqual(mockShipments);
      expect(result.total).toBe(2);
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);
      mockPrisma.shipment.count.mockResolvedValue(0);

      await repository.findAll({ status: 'PENDING', page: 1, limit: 10 });

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate correct skip for pagination', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);
      mockPrisma.shipment.count.mockResolvedValue(0);

      await repository.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should find shipment by id', async () => {
      const mockShipment = { id: '1', orderId: 'ORD-001' };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const result = await repository.findById('1');

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return null if not found', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('should find shipment by orderId', async () => {
      const mockShipment = { id: '1', orderId: 'ORD-001' };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const result = await repository.findByOrderId('ORD-001');

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.findUnique).toHaveBeenCalledWith({ where: { orderId: 'ORD-001' } });
    });
  });

  describe('findStaleShipments', () => {
    it('should find shipments needing sync', async () => {
      const mockShipments = [{ id: '1', lastSyncedAt: null }];
      mockPrisma.shipment.findMany.mockResolvedValue(mockShipments);

      const result = await repository.findStaleShipments(5);

      expect(result).toEqual(mockShipments);
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: expect.any(Date) } },
          ],
          status: { notIn: ['DELIVERED', 'FAILED'] },
        },
      });
    });

    it('should use default threshold of 5 minutes', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([]);

      await repository.findStaleShipments();

      expect(mockPrisma.shipment.findMany).toHaveBeenCalled();
    });
  });

  describe('findAllForSync', () => {
    it('should find all non-terminal shipments', async () => {
      const mockShipments = [{ id: '1', status: 'PENDING' }];
      mockPrisma.shipment.findMany.mockResolvedValue(mockShipments);

      const result = await repository.findAllForSync();

      expect(result).toEqual(mockShipments);
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
        where: { status: { notIn: ['DELIVERED', 'FAILED'] } },
      });
    });
  });

  describe('create', () => {
    it('should create a shipment with default status', async () => {
      const createDto = { orderId: 'ORD-001', customerName: 'John', destination: 'NYC' };
      const mockShipment = { id: '1', ...createDto, status: 'PENDING' };
      mockPrisma.shipment.create.mockResolvedValue(mockShipment);

      const result = await repository.create(createDto);

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.create).toHaveBeenCalledWith({
        data: {
          orderId: 'ORD-001',
          customerName: 'John',
          destination: 'NYC',
          status: 'PENDING',
        },
      });
    });

    it('should create a shipment with provided status', async () => {
      const createDto = { orderId: 'ORD-001', customerName: 'John', destination: 'NYC', status: 'IN_TRANSIT' as ShipmentStatus };
      mockPrisma.shipment.create.mockResolvedValue({ id: '1', ...createDto });

      await repository.create(createDto);

      expect(mockPrisma.shipment.create).toHaveBeenCalledWith({
        data: {
          orderId: 'ORD-001',
          customerName: 'John',
          destination: 'NYC',
          status: 'IN_TRANSIT',
        },
      });
    });
  });

  describe('update', () => {
    it('should update shipment fields', async () => {
      const updateDto = { customerName: 'Jane', destination: 'LA' };
      const mockShipment = { id: '1', orderId: 'ORD-001', ...updateDto };
      mockPrisma.shipment.update.mockResolvedValue(mockShipment);

      const result = await repository.update('1', updateDto);

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          customerName: 'Jane',
          destination: 'LA',
        },
      });
    });

    it('should update status', async () => {
      const updateDto = { status: 'IN_TRANSIT' as ShipmentStatus };
      mockPrisma.shipment.update.mockResolvedValue({ id: '1', status: 'IN_TRANSIT' });

      await repository.update('1', updateDto);

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'IN_TRANSIT',
        },
      });
    });
  });

  describe('updateWithSync', () => {
    it('should update status and lastSyncedAt', async () => {
      mockPrisma.shipment.update.mockResolvedValue({ id: '1', status: 'IN_TRANSIT' });

      await repository.updateWithSync('1', 'IN_TRANSIT');

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'IN_TRANSIT',
          lastSyncedAt: expect.any(Date),
          version: { increment: 1 },
        },
      });
    });

    it('should include carrierRef when provided', async () => {
      mockPrisma.shipment.update.mockResolvedValue({ id: '1', carrierRef: 'carrier-1' });

      await repository.updateWithSync('1', 'IN_TRANSIT', 'carrier-1');

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'IN_TRANSIT',
          lastSyncedAt: expect.any(Date),
          carrierRef: 'carrier-1',
          version: { increment: 1 },
        },
      });
    });
  });

  describe('updateCarrierRef', () => {
    it('should update carrier reference', async () => {
      mockPrisma.shipment.update.mockResolvedValue({ id: '1', carrierRef: 'carrier-1' });

      await repository.updateCarrierRef('1', 'carrier-1');

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { carrierRef: 'carrier-1' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a shipment', async () => {
      const mockShipment = { id: '1', orderId: 'ORD-001' };
      mockPrisma.shipment.delete.mockResolvedValue(mockShipment);

      const result = await repository.delete('1');

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('updateWithOptimisticLock', () => {
    it('should update with version check', async () => {
      const mockShipment = { id: '1', version: 2 };
      mockPrisma.shipment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const result = await repository.updateWithOptimisticLock(
        '1',
        { status: 'IN_TRANSIT' },
        1
      );

      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.updateMany).toHaveBeenCalledWith({
        where: { id: '1', version: 1 },
        data: {
          status: 'IN_TRANSIT',
          version: { increment: 1 },
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return null on version mismatch', async () => {
      mockPrisma.shipment.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.updateWithOptimisticLock(
        '1',
        { status: 'IN_TRANSIT' },
        1
      );

      expect(result).toBeNull();
      expect(mockPrisma.shipment.findUnique).not.toHaveBeenCalled();
    });
  });
});
