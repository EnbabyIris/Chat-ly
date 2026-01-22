import { describe, it, expect, beforeEach } from '@jest/globals';
import { globalErrorHandler, ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('Global Error Handler', () => {
  beforeEach(() => {
    globalErrorHandler.clearStats();
  });

  it('should provide global singleton instance', () => {
    const instance1 = ErrorHandler.getInstance();
    const instance2 = ErrorHandler.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe(globalErrorHandler);
  });

  it('should maintain state across global accesses', () => {
    const error1 = new Error('First error');
    const error2 = new Error('Second error');

    globalErrorHandler.handle(error1);
    globalErrorHandler.handle(error2);

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(2);

    // Access through getInstance should show same stats
    const instanceStats = ErrorHandler.getInstance().getErrorStats();
    expect(instanceStats['INTERNAL_ERROR']).toBe(2);
  });

  it('should handle concurrent error processing', () => {
    const errors = Array.from({ length: 100 }, (_, i) => 
      new Error(`Error ${i}`)
    );

    // Process errors concurrently
    errors.forEach(error => globalErrorHandler.handle(error));

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(100);
  });

  it('should work with async operations', async () => {
    const asyncErrors = [
      Promise.resolve(new Error('Async error 1')),
      Promise.resolve(new Error('Async error 2')),
      Promise.resolve(new Error('validation failed'))
    ];

    const resolvedErrors = await Promise.all(asyncErrors);
    resolvedErrors.forEach(error => globalErrorHandler.handle(error));

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(2);
    expect(stats['VALIDATION_ERROR']).toBe(1);
  });

  it('should handle global error callbacks', () => {
    let globalCallbackInvoked = false;
    let specificCallbackInvoked = false;

    globalErrorHandler.onError('*', () => {
      globalCallbackInvoked = true;
    });

    globalErrorHandler.onError('VALIDATION_ERROR', () => {
      specificCallbackInvoked = true;
    });

    const validationError = new Error('validation failed');
    const internalError = new Error('internal error');

    globalErrorHandler.handle(validationError);
    
    expect(globalCallbackInvoked).toBe(true);
    expect(specificCallbackInvoked).toBe(true);

    // Reset flags
    globalCallbackInvoked = false;
    specificCallbackInvoked = false;

    globalErrorHandler.handle(internalError);

    expect(globalCallbackInvoked).toBe(true);
    expect(specificCallbackInvoked).toBe(false); // Should not be called for internal error
  });

  it('should integrate with application lifecycle', () => {
    // Simulate application startup
    const startupError = new Error('startup configuration error');
    globalErrorHandler.handle(startupError);

    // Simulate runtime errors
    const runtimeErrors = [
      new Error('database connection lost'),
      new Error('external API timeout'),
      new Error('user validation failed')
    ];

    runtimeErrors.forEach(error => globalErrorHandler.handle(error));

    // Simulate shutdown errors
    const shutdownError = new Error('graceful shutdown timeout');
    globalErrorHandler.handle(shutdownError);

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(3); // startup, db, shutdown
    expect(stats['TIMEOUT']).toBe(1);
    expect(stats['VALIDATION_ERROR']).toBe(1);
  });

  it('should handle module-level error handling', () => {
    // Simulate different modules using global handler
    const moduleAError = new AppError({
      code: 'MODULE_A_ERROR',
      message: 'Module A specific error',
      statusCode: 400
    });

    const moduleBError = new AppError({
      code: 'MODULE_B_ERROR', 
      message: 'Module B specific error',
      statusCode: 500
    });

    globalErrorHandler.handle(moduleAError);
    globalErrorHandler.handle(moduleBError);

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['MODULE_A_ERROR']).toBe(1);
    expect(stats['MODULE_B_ERROR']).toBe(1);
  });

  it('should provide consistent error handling across contexts', () => {
    const contextualErrors = [
      { error: new Error('validation failed'), context: { module: 'auth' } },
      { error: new Error('not found'), context: { module: 'users' } },
      { error: new Error('validation failed'), context: { module: 'orders' } }
    ];

    contextualErrors.forEach(({ error, context }) => {
      globalErrorHandler.handle(error, {
        ...context,
        timestamp: Date.now()
      });
    });

    const stats = globalErrorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(2);
    expect(stats['NOT_FOUND']).toBe(1);
  });

  it('should handle error handler reinitialization', () => {
    // Add some errors
    globalErrorHandler.handle(new Error('test error 1'));
    globalErrorHandler.handle(new Error('test error 2'));

    expect(globalErrorHandler.getErrorStats()['INTERNAL_ERROR']).toBe(2);

    // Clear stats
    globalErrorHandler.clearStats();

    // Should still work after clear
    globalErrorHandler.handle(new Error('test error 3'));
    
    const stats = globalErrorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(1);
    expect(Object.keys(stats)).toHaveLength(1);
  });

  it('should handle high-load error scenarios', () => {
    const highLoadErrors = [];
    
    // Generate 1000 mixed errors
    for (let i = 0; i < 1000; i++) {
      if (i % 5 === 0) {
        highLoadErrors.push(new Error('validation failed'));
      } else if (i % 5 === 1) {
        highLoadErrors.push(new Error('not found'));
      } else if (i % 5 === 2) {
        highLoadErrors.push(new Error('timeout occurred'));
      } else if (i % 5 === 3) {
        highLoadErrors.push(new Error('unauthorized access'));
      } else {
        highLoadErrors.push(new Error('internal server error'));
      }
    }

    const startTime = Date.now();
    highLoadErrors.forEach(error => globalErrorHandler.handle(error));
    const endTime = Date.now();

    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(1000); // Should process 1000 errors in under 1 second

    const stats = globalErrorHandler.getErrorStats();
    const totalProcessed = Object.values(stats).reduce((sum, count) => sum + count, 0);
    expect(totalProcessed).toBe(1000);

    expect(stats['VALIDATION_ERROR']).toBe(200);
    expect(stats['NOT_FOUND']).toBe(200);
    expect(stats['TIMEOUT']).toBe(200);
    expect(stats['UNAUTHORIZED']).toBe(200);
    expect(stats['INTERNAL_ERROR']).toBe(200);
  });

  it('should handle memory efficiency with large error volumes', () => {
    const initialMemoryEstimate = Object.keys(globalErrorHandler.getErrorStats()).length;

    // Process many different error types
    for (let i = 0; i < 50; i++) {
      globalErrorHandler.handle(new AppError({
        code: `ERROR_TYPE_${i}`,
        message: `Error type ${i}`,
        statusCode: 400 + (i % 100)
      }));
    }

    const stats = globalErrorHandler.getErrorStats();
    expect(Object.keys(stats)).toHaveLength(50);

    // Clear should free memory
    globalErrorHandler.clearStats();
    const clearedStats = globalErrorHandler.getErrorStats();
    expect(Object.keys(clearedStats)).toHaveLength(0);
  });
});