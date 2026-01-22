import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Logging', () => {
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should log server errors with stack trace', () => {
    const error = new Error('Internal server error');
    const context = {
      userId: 'user123',
      requestId: 'req456',
      timestamp: Date.now()
    };

    errorHandler.handle(error, context);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logCall = consoleErrorSpy.mock.calls[0];
    
    expect(logCall[0]).toBe('[ErrorHandler]');
    
    const logData = JSON.parse(logCall[1]);
    expect(logData.level).toBe('error');
    expect(logData.code).toBe('INTERNAL_ERROR');
    expect(logData.message).toBe('Internal server error');
    expect(logData.statusCode).toBe(500);
    expect(logData.context).toEqual(context);
    expect(logData.stack).toBeDefined();
    expect(logData.timestamp).toBeDefined();
  });

  it('should log client errors without stack trace', () => {
    const error = new Error('validation failed');
    const context = {
      userId: 'user123',
      requestId: 'req456',
      timestamp: Date.now()
    };

    errorHandler.handle(error, context);

    const logCall = consoleErrorSpy.mock.calls[0];
    const logData = JSON.parse(logCall[1]);
    
    expect(logData.level).toBe('warn');
    expect(logData.code).toBe('VALIDATION_ERROR');
    expect(logData.statusCode).toBe(400);
    expect(logData.stack).toBeUndefined();
  });

  it('should include timestamp in log entries', () => {
    const error = new Error('Test error');
    const beforeTime = Date.now();
    
    errorHandler.handle(error);
    
    const logCall = consoleErrorSpy.mock.calls[0];
    const logData = JSON.parse(logCall[1]);
    
    expect(logData.timestamp).toBeDefined();
    expect(typeof logData.timestamp).toBe('string');
    
    const logTime = new Date(logData.timestamp).getTime();
    expect(logTime).toBeGreaterThanOrEqual(beforeTime);
  });

  it('should log context information when provided', () => {
    const error = new Error('Test error');
    const context = {
      userId: 'user123',
      requestId: 'req456',
      endpoint: '/api/test',
      timestamp: Date.now(),
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1'
    };

    errorHandler.handle(error, context);

    const logCall = consoleErrorSpy.mock.calls[0];
    const logData = JSON.parse(logCall[1]);
    
    expect(logData.context).toEqual(context);
  });

  it('should handle logging without context', () => {
    const error = new Error('Simple error');

    errorHandler.handle(error);

    const logCall = consoleErrorSpy.mock.calls[0];
    const logData = JSON.parse(logCall[1]);
    
    expect(logData.context).toBeUndefined();
    expect(logData.message).toBe('Simple error');
  });

  it('should log different error levels based on status code', () => {
    const clientError = new AppError({
      code: 'CLIENT_ERROR',
      message: 'Client error',
      statusCode: 400
    });

    const serverError = new AppError({
      code: 'SERVER_ERROR',
      message: 'Server error',
      statusCode: 500
    });

    errorHandler.handle(clientError);
    errorHandler.handle(serverError);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    
    const clientLogData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    const serverLogData = JSON.parse(consoleErrorSpy.mock.calls[1][1]);
    
    expect(clientLogData.level).toBe('warn');
    expect(serverLogData.level).toBe('error');
  });

  it('should format log data as valid JSON', () => {
    const error = new Error('JSON test');
    const context = {
      userId: 'user123',
      data: { nested: { value: 42 } },
      timestamp: Date.now()
    };

    errorHandler.handle(error, context);

    const logCall = consoleErrorSpy.mock.calls[0];
    const jsonString = logCall[1];
    
    expect(() => JSON.parse(jsonString)).not.toThrow();
    
    const logData = JSON.parse(jsonString);
    expect(logData.context.data.nested.value).toBe(42);
  });

  it('should handle special characters in error messages', () => {
    const error = new Error('Error with "quotes" and \n newlines and \t tabs');

    errorHandler.handle(error);

    const logCall = consoleErrorSpy.mock.calls[0];
    const jsonString = logCall[1];
    
    expect(() => JSON.parse(jsonString)).not.toThrow();
    
    const logData = JSON.parse(jsonString);
    expect(logData.message).toContain('"quotes"');
    expect(logData.message).toContain('\n');
    expect(logData.message).toContain('\t');
  });
});