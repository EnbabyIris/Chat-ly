import type { Response } from 'express';
import type { ApiResponse } from '@repo/shared/types';
import { HTTP_STATUS } from '@repo/shared/constants';

export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  error: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message?: string,
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    message,
  };
  return res.status(statusCode).json(response);
};