import { ErrorHandler, ErrorDetails, ErrorLog } from '../src/utils/error-handler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    ErrorHandler.reset()
  })

  describe('createError', () => {
    it('should create a standardized error with proper structure', () => {
      const error = ErrorHandler.createError(
        'TEST_ERROR',
        'Test error message',
        400,
        { userId: 'user123' }
      )

      expect(error).toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
        statusCode: 400,
        context: { userId: 'user123' },
      })
      expect(error.timestamp).toBeGreaterThan(0)
    })

    it('should default to status code 500 when not provided', () => {
      const error = ErrorHandler.createError('DEFAULT_ERROR', 'Default message')
      expect(error.statusCode).toBe(500)
    })

    it('should log the error automatically', () => {
      ErrorHandler.createError('LOGGED_ERROR', 'This should be logged')
      const logs = ErrorHandler.getAllErrorLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].error.code).toBe('LOGGED_ERROR')
    })
  })

  describe('handleApplicationError', () => {
    it('should handle ValidationError correctly', () => {
      const validationError = new Error('Invalid input')
      validationError.name = 'ValidationError'

      const error = ErrorHandler.handleApplicationError(validationError)

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
    })

    it('should handle UnauthorizedError correctly', () => {
      const authError = new Error('Access denied')
      authError.name = 'UnauthorizedError'

      const error = ErrorHandler.handleApplicationError(authError)

      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.statusCode).toBe(401)
    })

    it('should handle database errors correctly', () => {
      const dbError = new Error('Database connection failed')

      const error = ErrorHandler.handleApplicationError(dbError)

      expect(error.code).toBe('DATABASE_ERROR')
      expect(error.statusCode).toBe(500)
    })

    it('should handle network errors correctly', () => {
      const networkError = new Error('Network timeout occurred')

      const error = ErrorHandler.handleApplicationError(networkError)

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.statusCode).toBe(503)
    })

    it('should handle unknown errors with default values', () => {
      const unknownError = new Error('Something went wrong')

      const error = ErrorHandler.handleApplicationError(unknownError)

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('Something went wrong')
    })

    it('should include context and stack trace', () => {
      const testError = new Error('Test error')
      const context = { operation: 'test' }

      const error = ErrorHandler.handleApplicationError(testError, context)

      expect(error.context).toMatchObject({
        operation: 'test',
        originalError: 'Error',
      })
      expect(error.context?.stack).toBeDefined()
    })
  })

  describe('handleDatabaseError', () => {
    it('should handle duplicate key errors', () => {
      const duplicateError = new Error('duplicate key value violates unique constraint')

      const error = ErrorHandler.handleDatabaseError(duplicateError, 'INSERT INTO users...')

      expect(error.code).toBe('DUPLICATE_ENTRY')
      expect(error.statusCode).toBe(409)
      expect(error.message).toBe('Resource already exists')
      expect(error.context?.query).toBe('INSERT INTO users...')
    })

    it('should handle foreign key violations', () => {
      const fkError = new Error('foreign key constraint fails')

      const error = ErrorHandler.handleDatabaseError(fkError)

      expect(error.code).toBe('FOREIGN_KEY_VIOLATION')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Referenced resource does not exist')
    })

    it('should handle connection errors', () => {
      const connectionError = new Error('connection refused')

      const error = ErrorHandler.handleDatabaseError(connectionError)

      expect(error.code).toBe('DATABASE_CONNECTION_ERROR')
      expect(error.statusCode).toBe(503)
    })

    it('should handle timeout errors', () => {
      const timeoutError = new Error('query timeout exceeded')

      const error = ErrorHandler.handleDatabaseError(timeoutError)

      expect(error.code).toBe('DATABASE_TIMEOUT')
      expect(error.statusCode).toBe(504)
    })

    it('should handle generic database errors', () => {
      const genericError = new Error('database operation failed')

      const error = ErrorHandler.handleDatabaseError(genericError)

      expect(error.code).toBe('DATABASE_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('Database operation failed')
    })
  })

  describe('handleAuthError', () => {
    it('should handle invalid token error', () => {
      const error = ErrorHandler.handleAuthError('invalid_token')

      expect(error.code).toBe('INVALID_TOKEN')
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Invalid authentication token')
    })

    it('should handle expired token error', () => {
      const error = ErrorHandler.handleAuthError('expired_token')

      expect(error.code).toBe('EXPIRED_TOKEN')
      expect(error.statusCode).toBe(401)
    })

    it('should handle missing token error', () => {
      const error = ErrorHandler.handleAuthError('missing_token')

      expect(error.code).toBe('MISSING_TOKEN')
      expect(error.statusCode).toBe(401)
    })

    it('should handle insufficient permissions error', () => {
      const error = ErrorHandler.handleAuthError('insufficient_permissions')

      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('handleValidationError', () => {
    it('should handle validation errors with field details', () => {
      const fields = {
        email: ['is required', 'must be valid email'],
        password: ['is too short'],
      }

      const error = ErrorHandler.handleValidationError(fields)

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.message).toContain('email: is required, must be valid email')
      expect(error.message).toContain('password: is too short')
      expect(error.context?.fields).toEqual(fields)
    })

    it('should handle single field validation error', () => {
      const fields = { username: ['is already taken'] }

      const error = ErrorHandler.handleValidationError(fields)

      expect(error.message).toBe('Validation failed: username: is already taken')
    })
  })

  describe('error logging and statistics', () => {
    beforeEach(() => {
      // Create some test errors
      ErrorHandler.createError('ERROR_1', 'First error', 400)
      ErrorHandler.createError('ERROR_2', 'Second error', 500)
      ErrorHandler.createError('ERROR_1', 'Another first error', 400)
      ErrorHandler.createError('ERROR_3', 'Third error', 503)
    })

    it('should track error statistics correctly', () => {
      const stats = ErrorHandler.getErrorStatistics()

      expect(stats.totalErrors).toBe(4)
      expect(stats.errorsByCode).toEqual({
        ERROR_1: 2,
        ERROR_2: 1,
        ERROR_3: 1,
      })
      expect(stats.errorsByStatusCode).toEqual({
        400: 2,
        500: 1,
        503: 1,
      })
      expect(stats.criticalErrors).toBe(2) // 500 and 503 status codes
      expect(stats.resolvedErrors).toBe(0)
    })

    it('should filter statistics by time window', () => {
      // Create an old error (simulate by manipulating timestamp)
      const logs = ErrorHandler.getAllErrorLogs()
      if (logs.length > 0) {
        logs[0].error.timestamp = Date.now() - 7200000 // 2 hours ago
      }

      const stats = ErrorHandler.getErrorStatistics(3600000) // 1 hour window
      expect(stats.totalErrors).toBe(3) // Should exclude the old error
    })

    it('should identify critical errors', () => {
      const criticalErrors = ErrorHandler.getCriticalErrors()

      expect(criticalErrors).toHaveLength(2)
      expect(criticalErrors.every(log => log.error.statusCode >= 500)).toBe(true)
      expect(criticalErrors.every(log => !log.resolved)).toBe(true)
    })

    it('should resolve errors correctly', () => {
      const logs = ErrorHandler.getAllErrorLogs()
      const errorId = logs[0].id

      const resolved = ErrorHandler.resolveError(errorId, 'admin', 'Fixed the issue')

      expect(resolved).toBe(true)
      expect(logs[0].resolved).toBe(true)
      expect(logs[0].resolvedBy).toBe('admin')
      expect(logs[0].notes).toBe('Fixed the issue')
      expect(logs[0].resolvedAt).toBeGreaterThan(0)
    })

    it('should return false when resolving non-existent error', () => {
      const resolved = ErrorHandler.resolveError('non-existent-id', 'admin')
      expect(resolved).toBe(false)
    })

    it('should calculate average resolution time', () => {
      const logs = ErrorHandler.getAllErrorLogs()
      
      // Resolve some errors with different resolution times
      const now = Date.now()
      logs[0].resolved = true
      logs[0].resolvedAt = logs[0].error.timestamp + 1000 // 1 second
      logs[1].resolved = true
      logs[1].resolvedAt = logs[1].error.timestamp + 3000 // 3 seconds

      const stats = ErrorHandler.getErrorStatistics()
      expect(stats.resolvedErrors).toBe(2)
      expect(stats.averageResolutionTime).toBe(2000) // Average of 1000 and 3000
    })
  })

  describe('error trends', () => {
    it('should generate error trends over time', () => {
      // Create errors at different times
      const now = Date.now()
      const hourMs = 3600000

      ErrorHandler.createError('TREND_ERROR_1', 'Error 1', 400)
      ErrorHandler.createError('TREND_ERROR_2', 'Error 2', 500)

      // Simulate errors from previous hour
      const logs = ErrorHandler.getAllErrorLogs()
      logs[0].error.timestamp = now - hourMs - 1000 // Previous hour

      const trends = ErrorHandler.getErrorTrends(2) // 2 hours

      expect(trends).toHaveLength(2)
      expect(trends[0].errorCount).toBe(1) // Previous hour
      expect(trends[1].errorCount).toBe(1) // Current hour
      expect(trends[1].criticalCount).toBe(1) // One 500 error
    })

    it('should handle empty time periods in trends', () => {
      const trends = ErrorHandler.getErrorTrends(1)
      
      expect(trends).toHaveLength(1)
      expect(trends[0].errorCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('memory management', () => {
    it('should limit the number of stored error logs', () => {
      // Create more errors than the maximum allowed
      for (let i = 0; i < 1200; i++) {
        ErrorHandler.createError(`ERROR_${i}`, `Error ${i}`, 400)
      }

      const logs = ErrorHandler.getAllErrorLogs()
      expect(logs.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('error categorization', () => {
    it('should categorize errors by type correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.name = 'RateLimitError'

      const error = ErrorHandler.handleApplicationError(rateLimitError)

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.statusCode).toBe(429)
    })

    it('should categorize NotFoundError correctly', () => {
      const notFoundError = new Error('Resource not found')
      notFoundError.name = 'NotFoundError'

      const error = ErrorHandler.handleApplicationError(notFoundError)

      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
    })

    it('should categorize ConflictError correctly', () => {
      const conflictError = new Error('Resource conflict')
      conflictError.name = 'ConflictError'

      const error = ErrorHandler.handleApplicationError(conflictError)

      expect(error.code).toBe('CONFLICT')
      expect(error.statusCode).toBe(409)
    })

    it('should categorize ForbiddenError correctly', () => {
      const forbiddenError = new Error('Access forbidden')
      forbiddenError.name = 'ForbiddenError'

      const error = ErrorHandler.handleApplicationError(forbiddenError)

      expect(error.code).toBe('FORBIDDEN')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('error context and metadata', () => {
    it('should preserve error context and add metadata', () => {
      const originalError = new Error('Test error')
      const context = { 
        operation: 'user_creation',
        userId: 'user123',
        timestamp: Date.now()
      }

      const error = ErrorHandler.handleApplicationError(originalError, context)

      expect(error.context).toMatchObject(context)
      expect(error.context?.originalError).toBe('Error')
      expect(error.context?.stack).toBeDefined()
    })

    it('should handle errors without context gracefully', () => {
      const originalError = new Error('Test error')

      const error = ErrorHandler.handleApplicationError(originalError)

      expect(error.context?.originalError).toBe('Error')
      expect(error.context?.stack).toBeDefined()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex error scenarios with multiple error types', () => {
      // Simulate a complex scenario with multiple error types
      const validationError = ErrorHandler.handleValidationError({
        email: ['is required'],
        password: ['is too weak']
      })

      const dbError = ErrorHandler.handleDatabaseError(
        new Error('connection timeout'),
        'SELECT * FROM users WHERE email = ?'
      )

      const authError = ErrorHandler.handleAuthError('expired_token')

      // Check that all errors are logged
      const logs = ErrorHandler.getAllErrorLogs()
      expect(logs).toHaveLength(3)

      // Check statistics
      const stats = ErrorHandler.getErrorStatistics()
      expect(stats.totalErrors).toBe(3)
      expect(stats.errorsByStatusCode[400]).toBe(1) // validation error
      expect(stats.errorsByStatusCode[401]).toBe(1) // auth error
      expect(stats.errorsByStatusCode[504]).toBe(1) // db timeout error
    })

    it('should provide comprehensive error reporting for monitoring', () => {
      // Create a mix of errors
      ErrorHandler.createError('API_ERROR', 'API failed', 500)
      ErrorHandler.createError('VALIDATION_ERROR', 'Invalid data', 400)
      ErrorHandler.createError('AUTH_ERROR', 'Unauthorized', 401)
      ErrorHandler.createError('API_ERROR', 'Another API failure', 500)

      const stats = ErrorHandler.getErrorStatistics()
      const criticalErrors = ErrorHandler.getCriticalErrors()
      const trends = ErrorHandler.getErrorTrends(1)

      // Verify comprehensive reporting
      expect(stats.totalErrors).toBe(4)
      expect(stats.criticalErrors).toBe(2)
      expect(criticalErrors).toHaveLength(2)
      expect(trends[0].criticalCount).toBe(2)
      expect(stats.errorsByCode['API_ERROR']).toBe(2)
    })
  })
})