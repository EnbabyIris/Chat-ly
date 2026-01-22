import { describe, it, expect } from '@jest/globals';
import { AppError } from '../../src/utils/error-handler';

describe('AppError Class', () => {
  it('should create AppError with required properties', () => {
    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test error message',
      statusCode: 400
    });

    expect(error.name).toBe('AppError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(400);
    expect(error.retryable).toBe(false);
  });

  it('should set retryable flag correctly', () => {
    const retryableError = new AppError({
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout',
      statusCode: 408,
      retryable: true
    });

    expect(retryableError.retryable).toBe(true);
  });

  it('should include context when provided', () => {
    const context = {
      userId: 'user123',
      requestId: 'req456',
      timestamp: Date.now()
    };

    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 400,
      context
    });

    expect(error.context).toEqual(context);
  });

  it('should serialize to JSON correctly', () => {
    const context = {
      userId: 'user123',
      requestId: 'req456', 
      timestamp: Date.now()
    };

    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 400,
      context,
      retryable: true
    });

    const json = error.toJSON();

    expect(json.name).toBe('AppError');
    expect(json.code).toBe('TEST_ERROR');
    expect(json.message).toBe('Test message');
    expect(json.statusCode).toBe(400);
    expect(json.context).toEqual(context);
    expect(json.retryable).toBe(true);
    expect(json.timestamp).toBeDefined();
    expect(typeof json.timestamp).toBe('number');
  });

  it('should preserve custom stack trace', () => {
    const customStack = 'Custom stack trace';
    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 500,
      stack: customStack
    });

    expect(error.stack).toBe(customStack);
  });

  it('should handle missing optional properties', () => {
    const error = new AppError({
      code: 'SIMPLE_ERROR',
      message: 'Simple message',
      statusCode: 400
    });

    expect(error.context).toBeUndefined();
    expect(error.retryable).toBe(false);
    expect(error.stack).toBeDefined(); // Should have default stack
  });
});