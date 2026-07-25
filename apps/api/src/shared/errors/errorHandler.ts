import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('NOT_FOUND', 'Resource not found', 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof Error && err.message.includes('not allowed by CORS')) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'CORS origin not allowed',
      },
    });
    return;
  }

  console.error('[api] unexpected error', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
