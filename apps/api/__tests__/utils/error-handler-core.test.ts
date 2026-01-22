import { describe, it, expect, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Core', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  it('should handle basic errors', () => {
    const error = new Error('Test error');
    const appError = errorHandler.handle(error);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.message).toBe('Test error');
    expect(appError.code).toBe('INTERNAL_ERROR');
    expect(appError.statusCode).toBe(500);
  });

  it('should handle AppError instances', () => {
    const originalError = new AppError({
      code: 'CUSTOM_ERROR',
      message: 'Custom error message',
      statusCode: 400
    });

    const handled = errorHandler.handle(originalError);
    expect(handled).toBe(originalError);
    expect(handled.code).toBe('CUSTOM_ERROR');
  });

  it('should add context to errors', () => {
    const error = new Error('Test error');
    const context = {
      userId: 'user123',
      requestId: 'req456',
      timestamp: Date.now()
    };

    const appError = errorHandler.handle(error, context);
    expect(appError.context).toEqual(context);
  });

  it('should increment error counts', () => {
    const error1 = new Error('validation failed');
    const error2 = new Error('validation failed');
    const error3 = new Error('not found');

    errorHandler.handle(error1);
    errorHandler.handle(error2);
    errorHandler.handle(error3);

    const stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(2);
    expect(stats['NOT_FOUND']).toBe(1);
  });

  it('should clear error statistics', () => {
    const error = new Error('Test error');
    errorHandler.handle(error);

    expect(Object.keys(errorHandler.getErrorStats())).toHaveLength(1);
    
    errorHandler.clearStats();
    expect(Object.keys(errorHandler.getErrorStats())).toHaveLength(0);
  });
});