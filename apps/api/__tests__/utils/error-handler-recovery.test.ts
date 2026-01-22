import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Recovery', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  it('should identify retryable errors correctly', () => {
    const retryableErrors = [
      new Error('connection timeout'),
      new Error('network unreachable'),
      new Error('502 bad gateway'),
      new Error('503 service unavailable'),
      new Error('504 gateway timeout')
    ];

    const nonRetryableErrors = [
      new Error('validation failed'),
      new Error('unauthorized access'),
      new Error('forbidden resource'),
      new Error('not found')
    ];

    retryableErrors.forEach(error => {
      expect(errorHandler.isRetryable(error)).toBe(true);
    });

    nonRetryableErrors.forEach(error => {
      expect(errorHandler.isRetryable(error)).toBe(false);
    });
  });

  it('should respect AppError retryable flag', () => {
    const retryableAppError = new AppError({
      code: 'CUSTOM_ERROR',
      message: 'Custom retryable error',
      statusCode: 500,
      retryable: true
    });

    const nonRetryableAppError = new AppError({
      code: 'CUSTOM_ERROR', 
      message: 'Custom non-retryable error',
      statusCode: 500,
      retryable: false
    });

    expect(errorHandler.isRetryable(retryableAppError)).toBe(true);
    expect(errorHandler.isRetryable(nonRetryableAppError)).toBe(false);
  });

  it('should implement exponential backoff pattern', () => {
    // Simulate retry logic with exponential backoff
    const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000) => {
      return baseDelay * Math.pow(2, attempt);
    };

    expect(calculateBackoffDelay(0)).toBe(1000);  // 1 second
    expect(calculateBackoffDelay(1)).toBe(2000);  // 2 seconds
    expect(calculateBackoffDelay(2)).toBe(4000);  // 4 seconds
    expect(calculateBackoffDelay(3)).toBe(8000);  // 8 seconds
    expect(calculateBackoffDelay(4)).toBe(16000); // 16 seconds
  });

  it('should handle retry with circuit breaker', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(3, 5000);
    const unreliableFunction = jest.fn();

    // Mock function to fail first 2 times, then succeed
    unreliableFunction
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValue('Success');

    // Implement retry logic
    const retryWithBackoff = async (fn: Function, maxRetries: number = 3) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await circuitBreaker.execute(fn);
        } catch (error) {
          if (attempt === maxRetries || !errorHandler.isRetryable(error as Error)) {
            throw error;
          }
          // Wait before retry (in real implementation)
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
      }
    };

    const result = await retryWithBackoff(unreliableFunction);
    expect(result).toBe('Success');
    expect(unreliableFunction).toHaveBeenCalledTimes(3);
  });

  it('should handle graceful degradation', () => {
    const primaryService = jest.fn().mockRejectedValue(new Error('Primary service down'));
    const fallbackService = jest.fn().mockResolvedValue('Fallback result');

    const gracefulService = async () => {
      try {
        return await primaryService();
      } catch (error) {
        if (errorHandler.isRetryable(error as Error)) {
          console.log('Primary service failed, using fallback');
          return await fallbackService();
        }
        throw error;
      }
    };

    return gracefulService().then(result => {
      expect(result).toBe('Fallback result');
      expect(primaryService).toHaveBeenCalledTimes(1);
      expect(fallbackService).toHaveBeenCalledTimes(1);
    });
  });

  it('should track recovery attempts', () => {
    const error1 = new Error('timeout occurred');
    const error2 = new Error('network error');
    const error3 = new Error('validation failed');

    // Simulate handling errors and recovery attempts
    errorHandler.handle(error1);
    errorHandler.handle(error2);
    errorHandler.handle(error3);

    const stats = errorHandler.getErrorStats();
    
    // Verify retryable errors are tracked
    expect(stats['TIMEOUT']).toBe(1);
    expect(stats['INTERNAL_ERROR']).toBe(1); // network error gets classified as internal
    expect(stats['VALIDATION_ERROR']).toBe(1);
  });

  it('should handle bulk error recovery', () => {
    const errors = [
      new Error('connection timeout'),
      new Error('503 service unavailable'),
      new Error('network unreachable'),
      new Error('validation failed'),
      new Error('unauthorized access')
    ];

    const retryableCount = errors.filter(error => errorHandler.isRetryable(error)).length;
    const nonRetryableCount = errors.length - retryableCount;

    expect(retryableCount).toBe(3);
    expect(nonRetryableCount).toBe(2);

    // Process all errors
    errors.forEach(error => errorHandler.handle(error));

    const stats = errorHandler.getErrorStats();
    const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
    expect(totalErrors).toBe(errors.length);
  });

  it('should implement jittered backoff for avoiding thundering herd', () => {
    const calculateJitteredBackoff = (attempt: number, baseDelay: number = 1000) => {
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * exponentialDelay * 0.1; // 10% jitter
      return exponentialDelay + jitter;
    };

    const delay1 = calculateJitteredBackoff(2);
    const delay2 = calculateJitteredBackoff(2);

    // Base delay should be 4000ms for attempt 2
    expect(delay1).toBeGreaterThanOrEqual(4000);
    expect(delay1).toBeLessThanOrEqual(4400); // 4000 + 10% jitter

    expect(delay2).toBeGreaterThanOrEqual(4000);
    expect(delay2).toBeLessThanOrEqual(4400);

    // Delays should be different due to jitter
    expect(delay1).not.toBe(delay2);
  });

  it('should handle recovery callback registration', () => {
    const recoveryCallback = jest.fn();
    
    // Register callback for retryable errors
    errorHandler.onError('TIMEOUT', recoveryCallback);

    const retryableError = new Error('request timeout');
    const nonRetryableError = new Error('validation failed');

    errorHandler.handle(retryableError);
    errorHandler.handle(nonRetryableError);

    // Should only call recovery callback for timeout error
    expect(recoveryCallback).toHaveBeenCalledTimes(1);
    expect(recoveryCallback.mock.calls[0][0].code).toBe('TIMEOUT');
  });

  it('should handle complex recovery scenarios', async () => {
    const complexService = async (shouldFail: boolean = false) => {
      if (shouldFail) {
        throw new Error('connection timeout');
      }
      return 'Success';
    };

    let attempts = 0;
    const retryLogic = async (): Promise<string> => {
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          return await complexService(attempts < 3);
        } catch (error) {
          const appError = errorHandler.handle(error as Error);
          
          if (attempts >= maxAttempts || !errorHandler.isRetryable(appError)) {
            throw appError;
          }
          
          // Brief delay for test
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      throw new Error('Max attempts reached');
    };

    const result = await retryLogic();
    expect(result).toBe('Success');
    expect(attempts).toBe(3);
    
    const stats = errorHandler.getErrorStats();
    expect(stats['TIMEOUT']).toBe(2); // Failed twice before succeeding
  });
});