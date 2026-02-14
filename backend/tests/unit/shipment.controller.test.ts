import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ShipmentController } from '../../src/controllers/shipment.controller.js';

const mockShipmentService = {
  findAll: jest.fn<any>(),
  findById: jest.fn<any>(),
  create: jest.fn<any>(),
  update: jest.fn<any>(),
  delete: jest.fn<any>(),
};

const mockSyncService = {
  syncSingleShipment: jest.fn<any>(),
  syncAllShipments: jest.fn<any>(),
};

describe('ShipmentController', () => {
  let controller: ShipmentController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ShipmentController(
      mockShipmentService as any,
      mockSyncService as any
    );

    mockReq = {
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as any;
  });

  describe('findAll', () => {
    it('should return paginated shipments', async () => {
      const mockResult = {
        data: [{ id: '1', orderId: 'ORD-001' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockShipmentService.findAll.mockResolvedValue(mockResult);
      mockReq.query = { page: '1', limit: '10' };

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockShipmentService.findAll).toHaveBeenCalledWith({ page: '1', limit: '10' });
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should call next on error', async () => {
      const error = new Error('Database error');
      mockShipmentService.findAll.mockRejectedValue(error);

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findById', () => {
    it('should return shipment by id', async () => {
      const mockShipment = { id: '1', orderId: 'ORD-001' };
      mockShipmentService.findById.mockResolvedValue(mockShipment);
      mockReq.params = { id: '1' };

      await controller.findById(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockShipmentService.findById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockShipment });
    });

    it('should call next on error', async () => {
      const error = new Error('Not found');
      mockShipmentService.findById.mockRejectedValue(error);
      mockReq.params = { id: '1' };

      await controller.findById(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create a shipment and return 201', async () => {
      const createDto = { orderId: 'ORD-001', customerName: 'John', destination: 'NYC' };
      const mockShipment = { id: '1', ...createDto };
      mockShipmentService.create.mockResolvedValue(mockShipment);
      mockReq.body = createDto;

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockShipmentService.create).toHaveBeenCalledWith(createDto);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockShipment });
    });

    it('should call next on error', async () => {
      const error = new Error('Conflict');
      mockShipmentService.create.mockRejectedValue(error);
      mockReq.body = { orderId: 'ORD-001' };

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update a shipment', async () => {
      const updateDto = { customerName: 'Jane' };
      const mockShipment = { id: '1', orderId: 'ORD-001', customerName: 'Jane' };
      mockShipmentService.update.mockResolvedValue(mockShipment);
      mockReq.params = { id: '1' };
      mockReq.body = updateDto;

      await controller.update(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockShipmentService.update).toHaveBeenCalledWith('1', updateDto);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockShipment });
    });

    it('should call next on error', async () => {
      const error = new Error('Not found');
      mockShipmentService.update.mockRejectedValue(error);
      mockReq.params = { id: '1' };
      mockReq.body = { customerName: 'Jane' };

      await controller.update(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('should delete a shipment and return 204', async () => {
      mockShipmentService.delete.mockResolvedValue(undefined);
      mockReq.params = { id: '1' };

      await controller.delete(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockShipmentService.delete).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      const error = new Error('Not found');
      mockShipmentService.delete.mockRejectedValue(error);
      mockReq.params = { id: '1' };

      await controller.delete(mockReq as Request<{ id: string }>, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('triggerSync', () => {
    it('should sync all shipments when no shipmentId provided', async () => {
      const mockResult = { synced: 5, failed: 0, errors: [] };
      mockSyncService.syncAllShipments.mockResolvedValue(mockResult);
      mockReq.body = {};

      await controller.triggerSync(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSyncService.syncAllShipments).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockResult });
    });

    it('should sync single shipment when shipmentId provided', async () => {
      const mockResult = { status: 'IN_TRANSIT', lastSyncedAt: new Date() };
      mockSyncService.syncSingleShipment.mockResolvedValue(mockResult);
      mockReq.body = { shipmentId: '1' };

      await controller.triggerSync(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSyncService.syncSingleShipment).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockResult });
    });

    it('should call next on error', async () => {
      const error = new Error('Sync failed');
      mockSyncService.syncAllShipments.mockRejectedValue(error);
      mockReq.body = {};

      await controller.triggerSync(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
