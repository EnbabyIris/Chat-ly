import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError, errorMiddleware, globalErrorHandler } from '../../src/utils/error-handler';

describe('ErrorHandler Integration', () => {
  let errorHandler: ErrorHandler;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();

    mockReq = {
      id: 'req-123',
      path: '/api/integration',
      ip: '192.168.1.1',
      user: { id: 'user-456' },
      get: jest.fn(() => 'Test Integration Browser')
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('should integrate error handling with middleware and callbacks', () => {
    const alertCallback = jest.fn();
    const metricsCallback = jest.fn();

    // Register monitoring callbacks
    errorHandler.onError('*', alertCallback);
    errorHandler.onError('INTERNAL_ERROR', metricsCallback);

    const error = new Error('Database connection failed');
    
    // Process through middleware
    errorMiddleware(error, mockReq, mockRes, jest.fn());

    // Verify middleware response
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Database connection failed'
      }
    });

    // Verify callbacks were called
    expect(alertCallback).toHaveBeenCalledTimes(1);
    expect(metricsCallback).toHaveBeenCalledTimes(1);

    // Verify stats tracking
    const stats = errorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(1);
  });

  it('should handle complex error flow with circuit breaker', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(2, 1000);
    const monitoringCallback = jest.fn();
    
    errorHandler.onError('*', monitoringCallback);

    const failingService = jest.fn().mockRejectedValue(new Error('Service unavailable'));

    // First failure
    try {
      await circuitBreaker.execute(failingService);
    } catch (error) {
      errorHandler.handle(error as Error);
    }

    // Second failure - should open circuit
    try {
      await circuitBreaker.execute(failingService);
    } catch (error) {
      errorHandler.handle(error as Error);
    }

    // Third attempt - circuit should be open
    try {
      await circuitBreaker.execute(failingService);
    } catch (error) {
      const appError = errorHandler.handle(error as Error);
      expect(appError.code).toBe('CIRCUIT_BREAKER_OPEN');
    }

    const stats = errorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(2); // First two failures
    expect(stats['CIRCUIT_BREAKER_OPEN']).toBe(1); // Circuit open error

    expect(monitoringCallback).toHaveBeenCalledTimes(3);
    expect(failingService).toHaveBeenCalledTimes(2); // Third call blocked by circuit
  });

  it('should integrate with different error sources', () => {
    const errorSources = [
      // API validation error
      { 
        error: new Error('validation failed'),
        source: 'API',
        expectedCode: 'VALIDATION_ERROR',
        expectedStatus: 400
      },
      // Database error  
      {
        error: new Error('connection timeout'),
        source: 'Database',
        expectedCode: 'TIMEOUT',
        expectedStatus: 408
      },
      // External service error
      {
        error: new AppError({
          code: 'EXTERNAL_SERVICE_ERROR',
          message: 'Third party API failed',
          statusCode: 502,
          retryable: true
        }),
        source: 'External',
        expectedCode: 'EXTERNAL_SERVICE_ERROR',
        expectedStatus: 502
      }
    ];

    errorSources.forEach(({ error, source, expectedCode, expectedStatus }) => {
      const context = { 
        source,
        timestamp: Date.now(),
        requestId: `req-${source.toLowerCase()}`
      };

      const handledError = errorHandler.handle(error, context);
      
      expect(handledError.code).toBe(expectedCode);
      expect(handledError.statusCode).toBe(expectedStatus);
      expect(handledError.context).toMatchObject(context);
    });

    const stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(1);
    expect(stats['TIMEOUT']).toBe(1);
    expect(stats['EXTERNAL_SERVICE_ERROR']).toBe(1);
  });

  it('should handle end-to-end error processing workflow', async () => {
    const workflowCallback = jest.fn();
    const criticalErrorCallback = jest.fn();

    errorHandler.onError('*', workflowCallback);
    errorHandler.onError('CRITICAL_ERROR', criticalErrorCallback);

    // Simulate application workflow
    const simulateWorkflow = async () => {
      try {
        // Step 1: User validation
        throw new Error('validation failed');
      } catch (error) {
        errorHandler.handle(error as Error, { step: 'validation', userId: 'user123' });
        
        try {
          // Step 2: Fallback processing  
          throw new Error('timeout occurred');
        } catch (fallbackError) {
          errorHandler.handle(fallbackError as Error, { step: 'fallback', userId: 'user123' });
          
          // Step 3: Critical system error
          const criticalError = new AppError({
            code: 'CRITICAL_ERROR',
            message: 'System integrity compromised',
            statusCode: 500
          });
          
          errorHandler.handle(criticalError, { step: 'critical', userId: 'user123' });
          throw criticalError;
        }
      }
    };

    await expect(simulateWorkflow()).rejects.toThrow('System integrity compromised');

    // Verify all callbacks and stats
    expect(workflowCallback).toHaveBeenCalledTimes(3);
    expect(criticalErrorCallback).toHaveBeenCalledTimes(1);

    const stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(1);
    expect(stats['TIMEOUT']).toBe(1);
    expect(stats['CRITICAL_ERROR']).toBe(1);
  });

  it('should handle concurrent error processing with shared resources', async () => {
    const sharedResource = jest.fn();
    const concurrencyCallback = jest.fn();
    
    errorHandler.onError('*', concurrencyCallback);

    const concurrentOperations = Array.from({ length: 10 }, async (_, index) => {
      try {
        sharedResource.mockRejectedValueOnce(new Error(`Concurrent error ${index}`));
        await sharedResource();
      } catch (error) {
        errorHandler.handle(error as Error, { 
          operationId: index,
          timestamp: Date.now()
        });
      }
    });

    await Promise.all(concurrentOperations);

    expect(concurrencyCallback).toHaveBeenCalledTimes(10);
    
    const stats = errorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(10);
  });

  it('should integrate with monitoring and alerting systems', () => {
    const alertingSystem = {
      sendAlert: jest.fn(),
      logMetric: jest.fn(),
      updateDashboard: jest.fn()
    };

    // Register monitoring callbacks
    errorHandler.onError('CRITICAL_ERROR', (error) => {
      alertingSystem.sendAlert({
        severity: 'high',
        message: error.message,
        code: error.code,
        timestamp: Date.now()
      });
    });

    errorHandler.onError('*', (error) => {
      alertingSystem.logMetric({
        errorCode: error.code,
        statusCode: error.statusCode,
        retryable: error.retryable
      });
    });

    // Process various errors
    const errors = [
      new AppError({
        code: 'CRITICAL_ERROR',
        message: 'Database cluster down',
        statusCode: 500
      }),
      new Error('validation failed'),
      new Error('user not found')
    ];

    errors.forEach(error => errorHandler.handle(error));

    // Verify monitoring integration
    expect(alertingSystem.sendAlert).toHaveBeenCalledTimes(1);
    expect(alertingSystem.logMetric).toHaveBeenCalledTimes(3);

    const alertCall = alertingSystem.sendAlert.mock.calls[0][0];
    expect(alertCall.severity).toBe('high');
    expect(alertCall.code).toBe('CRITICAL_ERROR');
  });

  it('should handle graceful degradation scenarios', async () => {
    const primaryService = jest.fn().mockRejectedValue(new Error('Primary service down'));
    const secondaryService = jest.fn().mockRejectedValue(new Error('Secondary service down'));
    const fallbackService = jest.fn().mockResolvedValue('Fallback success');

    const degradationCallback = jest.fn();
    errorHandler.onError('*', degradationCallback);

    const gracefulService = async () => {
      const services = [primaryService, secondaryService, fallbackService];
      
      for (let i = 0; i < services.length; i++) {
        try {
          return await services[i]();
        } catch (error) {
          const handledError = errorHandler.handle(error as Error, {
            serviceLevel: i + 1,
            degradationStep: i
          });
          
          if (i === services.length - 1) {
            throw handledError;
          }
          
          // Continue to next service level
        }
      }
    };

    const result = await gracefulService();
    
    expect(result).toBe('Fallback success');
    expect(degradationCallback).toHaveBeenCalledTimes(2); // Primary and secondary failures
    
    const stats = errorHandler.getErrorStats();
    expect(stats['INTERNAL_ERROR']).toBe(2);
  });

  it('should provide comprehensive error reporting', () => {
    const errors = [
      new Error('validation failed'),
      new Error('not found'),
      new Error('unauthorized access'),
      new Error('internal server error'),
      new Error('timeout occurred')
    ];

    errors.forEach((error, index) => {
      errorHandler.handle(error, {
        requestId: `req-${index}`,
        userId: `user-${index}`,
        endpoint: `/api/test/${index}`,
        timestamp: Date.now()
      });
    });

    const stats = errorHandler.getErrorStats();
    const report = {
      totalErrors: Object.values(stats).reduce((sum, count) => sum + count, 0),
      errorBreakdown: stats,
      mostFrequentError: Object.entries(stats).sort(([,a], [,b]) => b - a)[0],
      retryableErrors: Object.entries(stats).filter(([code]) => {
        const error = new AppError({ code, message: '', statusCode: 500 });
        return errorHandler.isRetryable(error);
      })
    };

    expect(report.totalErrors).toBe(5);
    expect(report.errorBreakdown).toHaveProperty('VALIDATION_ERROR', 1);
    expect(report.errorBreakdown).toHaveProperty('NOT_FOUND', 1);
    expect(report.errorBreakdown).toHaveProperty('UNAUTHORIZED', 1);
    expect(report.errorBreakdown).toHaveProperty('INTERNAL_ERROR', 1);
    expect(report.errorBreakdown).toHaveProperty('TIMEOUT', 1);
  });
});