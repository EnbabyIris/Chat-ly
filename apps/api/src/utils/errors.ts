import { HTTP_STATUS } from '@repo/shared/constants';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.BAD_REQUEST, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(HTTP_STATUS.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(HTTP_STATUS.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.CONFLICT, message);
  }
}