import { describe, it, expect, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Classification', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  it('should classify validation errors correctly', () => {
    const error = new Error('validation failed for user input');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('VALIDATION_ERROR');
    expect(appError.statusCode).toBe(400);
    expect(appError.retryable).toBe(false);
  });

  it('should classify unauthorized errors correctly', () => {
    const error = new Error('unauthorized access attempt');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('UNAUTHORIZED');
    expect(appError.statusCode).toBe(401);
    expect(appError.retryable).toBe(false);
  });

  it('should classify forbidden errors correctly', () => {
    const error = new Error('forbidden resource access');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('FORBIDDEN');
    expect(appError.statusCode).toBe(403);
    expect(appError.retryable).toBe(false);
  });

  it('should classify not found errors correctly', () => {
    const error = new Error('resource not found');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('NOT_FOUND');
    expect(appError.statusCode).toBe(404);
    expect(appError.retryable).toBe(false);
  });

  it('should classify timeout errors correctly', () => {
    const error = new Error('request timeout exceeded');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('TIMEOUT');
    expect(appError.statusCode).toBe(408);
    expect(appError.retryable).toBe(true);
  });

  it('should classify rate limit errors correctly', () => {
    const error = new Error('rate limit exceeded');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('RATE_LIMITED');
    expect(appError.statusCode).toBe(429);
    expect(appError.retryable).toBe(true);
  });

  it('should default to internal error for unknown types', () => {
    const error = new Error('unknown error type');
    const appError = errorHandler.handle(error);

    expect(appError.code).toBe('INTERNAL_ERROR');
    expect(appError.statusCode).toBe(500);
    expect(appError.retryable).toBe(false);
  });

  it('should check if errors are retryable', () => {
    const timeoutError = new Error('connection timeout');
    const networkError = new Error('network unreachable');
    const validationError = new Error('validation failed');

    expect(errorHandler.isRetryable(timeoutError)).toBe(true);
    expect(errorHandler.isRetryable(networkError)).toBe(true);
    expect(errorHandler.isRetryable(validationError)).toBe(false);
  });

  it('should respect AppError retryable flag', () => {
    const retryableError = new AppError({
      code: 'CUSTOM_ERROR',
      message: 'Custom retryable error',
      statusCode: 500,
      retryable: true
    });

    const nonRetryableError = new AppError({
      code: 'CUSTOM_ERROR',
      message: 'Custom non-retryable error',
      statusCode: 400,
      retryable: false
    });

    expect(errorHandler.isRetryable(retryableError)).toBe(true);
    expect(errorHandler.isRetryable(nonRetryableError)).toBe(false);
  });
});