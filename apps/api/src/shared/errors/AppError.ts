export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
  }
}
