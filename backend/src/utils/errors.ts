import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public readonly details?: unknown
  ) {
    super(message);
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, StatusCodes.CONFLICT);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, details);
  }
}

export class ExternalApiError extends AppError {
  public readonly externalStatusCode?: number;

  constructor(service: string, originalError?: Error & { response?: { status?: number } }) {
    const statusCode = originalError?.response?.status;
    super(`External API error: ${service}`, StatusCodes.BAD_GATEWAY, {
      service,
      originalMessage: originalError?.message,
      externalStatusCode: statusCode,
    });
    this.externalStatusCode = statusCode;
  }

  isNotFound(): boolean {
    return this.externalStatusCode === 404;
  }
}

export class SyncInProgressError extends AppError {
  constructor() {
    super('Sync operation already in progress', StatusCodes.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', StatusCodes.TOO_MANY_REQUESTS);
  }
}
