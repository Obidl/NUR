import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/AppError.js';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));

      next(new AppError('VALIDATION_ERROR', 'Validation failed', 422, details));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'query',
        message: issue.message,
      }));

      next(new AppError('VALIDATION_ERROR', 'Validation failed', 422, details));
      return;
    }

    req.validatedQuery = parsed.data;
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'params',
        message: issue.message,
      }));

      next(new AppError('VALIDATION_ERROR', 'Validation failed', 422, details));
      return;
    }

    req.validatedParams = parsed.data;
    next();
  };
}
