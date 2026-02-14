import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { errorHandler, notFoundHandler } from '../../src/middlewares/error.middleware.js';
import { AppError, NotFoundError, ConflictError } from '../../src/utils/errors.js';

describe('Error Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      path: '/api/test',
      method: 'GET',
      headers: { 'x-request-id': 'req-123' },
    };

    mockRes = {
      status: jest.fn<any>().mockReturnThis(),
      json: jest.fn<any>().mockReturnThis(),
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status code', () => {
      const error = new AppError('Custom error', StatusCodes.BAD_REQUEST);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Custom error',
        })
      );
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Shipment');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Shipment not found',
        })
      );
    });

    it('should handle ConflictError', () => {
      const error = new ConflictError('Order ID already exists');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Order ID already exists',
        })
      );
    });

    it('should handle AppError with details', () => {
      const error = new AppError('Validation failed', StatusCodes.BAD_REQUEST, {
        field: 'orderId',
        reason: 'required',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Validation failed',
          details: { field: 'orderId', reason: 'required' },
        })
      );
    });

    it('should handle Prisma P2002 unique constraint error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'A record with this value already exists',
          code: 'P2002',
        })
      );
    });

    it('should handle Prisma P2025 not found error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Record not found',
          code: 'P2025',
        })
      );
    });

    it('should handle Prisma P2003 foreign key error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Foreign key constraint failed',
          code: 'P2003',
        })
      );
    });

    it('should handle unknown Prisma error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unknown', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Database error',
        })
      );
    });

    it('should handle Prisma validation error', () => {
      const error = new Prisma.PrismaClientValidationError('Invalid data', {
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Invalid data provided',
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route info', () => {
      const notFoundReq = {
        method: 'POST',
        path: '/api/unknown',
      } as Request;

      notFoundHandler(notFoundReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Route POST /api/unknown not found',
      });
    });
  });
});
