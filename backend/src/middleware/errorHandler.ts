import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (statusCode >= 500) {
      logger.error(`[${req.method}] ${req.path} — ${message}`, { stack: err.stack });
    } else {
      logger.warn(`[${req.method}] ${req.path} — ${statusCode} ${message}`);
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    logger.warn(`Validation error on ${req.path}: ${message}`);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = 409;
    message = 'Duplicate field value';
  } else {
    logger.error(`Unhandled error on [${req.method}] ${req.path}`, {
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  logger.warn(`404 — Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
