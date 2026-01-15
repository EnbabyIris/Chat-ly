import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS } from '@repo/shared/constants';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  errorResponse(
    res,
    'Internal server error',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? err.message : undefined,
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
};