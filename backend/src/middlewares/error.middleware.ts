import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): { statusCode: number; message: string } => {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: StatusCodes.CONFLICT,
        message: 'A record with this value already exists',
      };
    case 'P2025':
      return {
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Record not found',
      };
    case 'P2003':
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Foreign key constraint failed',
      };
    default:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Database error',
      };
  }
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string;

  logger.error('Request error', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      status: 'error',
      message: error.message,
      details: error.details,
    };

    if (env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    return res.status(error.statusCode).json(response);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    return res.status(prismaError.statusCode).json({
      status: 'error',
      message: prismaError.message,
      code: error.code,
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Invalid data provided',
    });
  }

  const response: ErrorResponse = {
    status: 'error',
    message:
      env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  };

  if (env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
