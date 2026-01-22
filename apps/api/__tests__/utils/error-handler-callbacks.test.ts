import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Callbacks', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  it('should register and call error callbacks', () => {
    const callback = jest.fn();
    errorHandler.onError('TEST_ERROR', callback);

    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test error',
      statusCode: 400
    });

    errorHandler.handle(error);
    expect(callback).toHaveBeenCalledWith(error);
  });

  it('should call multiple callbacks for same error code', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    errorHandler.onError('TEST_ERROR', callback1);
    errorHandler.onError('TEST_ERROR', callback2);

    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test error',
      statusCode: 400
    });

    errorHandler.handle(error);
    
    expect(callback1).toHaveBeenCalledWith(error);
    expect(callback2).toHaveBeenCalledWith(error);
  });

  it('should call wildcard callbacks for all errors', () => {
    const wildcardCallback = jest.fn();
    const specificCallback = jest.fn();
    
    errorHandler.onError('*', wildcardCallback);
    errorHandler.onError('SPECIFIC_ERROR', specificCallback);

    const error1 = new AppError({
      code: 'SPECIFIC_ERROR',
      message: 'Specific error',
      statusCode: 400
    });

    const error2 = new AppError({
      code: 'OTHER_ERROR',
      message: 'Other error',
      statusCode: 500
    });

    errorHandler.handle(error1);
    errorHandler.handle(error2);

    expect(wildcardCallback).toHaveBeenCalledTimes(2);
    expect(specificCallback).toHaveBeenCalledTimes(1);
    expect(specificCallback).toHaveBeenCalledWith(error1);
  });

  it('should not call callbacks for different error codes', () => {
    const callback = jest.fn();
    errorHandler.onError('SPECIFIC_ERROR', callback);

    const error = new AppError({
      code: 'DIFFERENT_ERROR',
      message: 'Different error',
      statusCode: 400
    });

    errorHandler.handle(error);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle callback exceptions gracefully', () => {
    const failingCallback = jest.fn(() => {
      throw new Error('Callback failed');
    });
    const workingCallback = jest.fn();

    errorHandler.onError('TEST_ERROR', failingCallback);
    errorHandler.onError('TEST_ERROR', workingCallback);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const error = new AppError({
      code: 'TEST_ERROR',
      message: 'Test error',
      statusCode: 400
    });

    errorHandler.handle(error);

    expect(failingCallback).toHaveBeenCalled();
    expect(workingCallback).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error in error callback:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should call callbacks with correct error context', () => {
    const callback = jest.fn();
    errorHandler.onError('TEST_ERROR', callback);

    const context = {
      userId: 'user123',
      requestId: 'req456',
      timestamp: Date.now()
    };

    const error = new Error('Test error');
    const handledError = errorHandler.handle(error, context);

    expect(callback).toHaveBeenCalledWith(handledError);
    expect(callback.mock.calls[0][0].context).toEqual(context);
  });
});