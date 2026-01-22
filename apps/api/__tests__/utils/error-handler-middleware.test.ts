import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { errorMiddleware, ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();

    mockReq = {
      id: 'req-123',
      path: '/api/test',
      ip: '192.168.1.1',
      user: { id: 'user-456' },
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 Test Browser';
        return undefined;
      })
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  it('should handle errors and send appropriate response', () => {
    const error = new Error('Test error');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Test error'
      }
    });
  });

  it('should handle AppError instances correctly', () => {
    const error = new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: 400
    });
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input'
      }
    });
  });

  it('should include context for client errors', () => {
    const error = new Error('validation failed');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'validation failed',
        context: {
          requestId: 'req-123',
          endpoint: '/api/test',
          timestamp: expect.any(Number),
          userAgent: 'Mozilla/5.0 Test Browser',
          ip: '192.168.1.1',
          userId: 'user-456'
        }
      }
    });
  });

  it('should exclude context for server errors', () => {
    const error = new Error('Database connection failed');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Database connection failed'
      }
    });
  });

  it('should handle missing request properties gracefully', () => {
    const incompleteReq = {
      path: '/api/test',
      get: jest.fn(() => undefined)
    };

    const error = new Error('Test error');
    
    errorMiddleware(error, incompleteReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Test error'
      }
    });
  });

  it('should extract context from request properly', () => {
    const error = new Error('validation failed');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    const stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(1);
  });

  it('should handle different error types correctly', () => {
    const errors = [
      { error: new Error('unauthorized access'), expectedStatus: 401 },
      { error: new Error('forbidden resource'), expectedStatus: 403 },
      { error: new Error('not found'), expectedStatus: 404 },
      { error: new Error('request timeout'), expectedStatus: 408 },
      { error: new Error('rate limit exceeded'), expectedStatus: 429 }
    ];

    errors.forEach(({ error, expectedStatus }) => {
      // Reset mocks
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
    });
  });

  it('should work without user in request', () => {
    const reqWithoutUser = {
      ...mockReq,
      user: undefined
    };

    const error = new Error('validation failed');
    
    errorMiddleware(error, reqWithoutUser, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'validation failed',
        context: expect.not.objectContaining({
          userId: expect.anything()
        })
      }
    });
  });

  it('should handle malformed User-Agent header', () => {
    mockReq.get.mockImplementation((header: string) => {
      if (header === 'User-Agent') return null;
      return undefined;
    });

    const error = new Error('test error');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    // Should not throw an error despite malformed header
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should create proper error context timestamp', () => {
    const beforeTime = Date.now();
    const error = new Error('validation failed');
    
    errorMiddleware(error, mockReq, mockRes, mockNext);

    const jsonCall = mockRes.json.mock.calls[0][0];
    const timestamp = jsonCall.error.context.timestamp;
    
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
  });
});