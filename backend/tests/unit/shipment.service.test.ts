import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ShipmentService } from '../../src/services/shipment.service.js';
import { ShipmentRepository } from '../../src/repositories/shipment.repository.js';
import { CarrierClient } from '../../src/external/carrier.client.js';
import { NotFoundError, ConflictError } from '../../src/utils/errors.js';
import type { Shipment, ShipmentStatus } from '@prisma/client';

const mockShipment: Shipment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  orderId: 'ORD-001',
  customerName: 'John Doe',
  destination: '123 Main St',
  status: 'PENDING' as ShipmentStatus,
  lastSyncedAt: null,
  carrierRef: null,
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ShipmentService', () => {
  let service: ShipmentService;
  let mockRepository: jest.Mocked<ShipmentRepository>;
  let mockCarrier: jest.Mocked<CarrierClient>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateCarrierRef: jest.fn(),
    } as unknown as jest.Mocked<ShipmentRepository>;

    mockCarrier = {
      registerShipment: jest.fn(),
      updateShipment: jest.fn(),
      getShipmentStatus: jest.fn(),
      mapInternalStatusToCarrier: jest.fn(),
      mapCarrierStatusToInternal: jest.fn(),
    } as unknown as jest.Mocked<CarrierClient>;

    service = new ShipmentService(mockRepository, mockCarrier);
  });

  describe('findAll', () => {
    it('should return paginated shipments', async () => {
      mockRepository.findAll.mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      mockRepository.findAll.mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      await service.findAll({ status: 'PENDING', page: 1, limit: 10 });

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        status: 'PENDING',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return shipment by id', async () => {
      mockRepository.findById.mockResolvedValue(mockShipment);

      const result = await service.findById(mockShipment.id);

      expect(result.id).toBe(mockShipment.id);
      expect(result.orderId).toBe(mockShipment.orderId);
    });

    it('should throw NotFoundError if shipment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a new shipment', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockShipment);
      mockCarrier.registerShipment.mockResolvedValue({
        id: 'carrier-123',
        orderId: mockShipment.orderId,
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });

      const result = await service.create({
        orderId: 'ORD-001',
        customerName: 'John Doe',
        destination: '123 Main St',
      });

      expect(result.orderId).toBe('ORD-001');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if order ID exists', async () => {
      mockRepository.findByOrderId.mockResolvedValue(mockShipment);

      await expect(
        service.create({
          orderId: 'ORD-001',
          customerName: 'John Doe',
          destination: '123 Main St',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should handle carrier registration failure gracefully', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockShipment);
      mockCarrier.registerShipment.mockRejectedValue(new Error('Carrier unavailable'));

      const result = await service.create({
        orderId: 'ORD-001',
        customerName: 'John Doe',
        destination: '123 Main St',
      });

      expect(result.orderId).toBe('ORD-001');
    });
  });

  describe('update', () => {
    it('should update an existing shipment', async () => {
      const updatedShipment = { ...mockShipment, customerName: 'Jane Doe' };
      mockRepository.findById.mockResolvedValue(mockShipment);
      mockRepository.update.mockResolvedValue(updatedShipment);

      const result = await service.update(mockShipment.id, {
        customerName: 'Jane Doe',
      });

      expect(result.customerName).toBe('Jane Doe');
    });

    it('should throw NotFoundError if shipment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { customerName: 'Jane Doe' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete an existing shipment', async () => {
      mockRepository.findById.mockResolvedValue(mockShipment);
      mockRepository.delete.mockResolvedValue(mockShipment);

      await service.delete(mockShipment.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockShipment.id);
    });

    it('should throw NotFoundError if shipment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
