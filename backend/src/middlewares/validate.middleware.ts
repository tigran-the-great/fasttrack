import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type RequestLocation = 'body' | 'query' | 'params';

export const validate = (
  schema: ZodSchema,
  location: RequestLocation = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[location];
      const parsed = schema.parse(data);

      req[location] = parsed;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
