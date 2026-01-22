export interface ErrorDetails {
  code: string
  message: string
  statusCode: number
  timestamp: number
  requestId?: string
  userId?: string
  stack?: string
  context?: Record<string, any>
}

export interface ErrorLog {
  id: string
  error: ErrorDetails
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
  notes?: string
}

export class ErrorHandler {
  private static errorLogs: ErrorLog[] = []
  private static readonly MAX_LOGS = 1000

  /**
   * Creates a standardized error with proper logging
   */
  static createError(
    code: string,
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ): ErrorDetails {
    const error: ErrorDetails = {
      code,
      message,
      statusCode,
      timestamp: Date.now(),
      context,
    }

    // Log the error
    this.logError(error)

    return error
  }

  /**
   * Logs error with automatic categorization
   */
  static logError(error: ErrorDetails, requestId?: string, userId?: string): void {
    const enhancedError: ErrorDetails = {
      ...error,
      requestId,
      userId,
      stack: new Error().stack,
    }

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      error: enhancedError,
      resolved: false,
    }

    this.errorLogs.push(errorLog)
    this.cleanupOldLogs()

    // Auto-categorize and handle based on severity
    this.handleErrorBySeverity(enhancedError)
  }

  /**
   * Handles different types of application errors
   */
  static handleApplicationError(error: Error, context?: Record<string, any>): ErrorDetails {
    let errorCode = 'UNKNOWN_ERROR'
    let statusCode = 500
    let message = error.message || 'An unexpected error occurred'

    // Categorize common error types
    if (error.name === 'ValidationError') {
      errorCode = 'VALIDATION_ERROR'
      statusCode = 400
    } else if (error.name === 'UnauthorizedError') {
      errorCode = 'UNAUTHORIZED'
      statusCode = 401
    } else if (error.name === 'ForbiddenError') {
      errorCode = 'FORBIDDEN'
      statusCode = 403
    } else if (error.name === 'NotFoundError') {
      errorCode = 'NOT_FOUND'
      statusCode = 404
    } else if (error.name === 'ConflictError') {
      errorCode = 'CONFLICT'
      statusCode = 409
    } else if (error.name === 'RateLimitError') {
      errorCode = 'RATE_LIMIT_EXCEEDED'
      statusCode = 429
    } else if (error.message.includes('database')) {
      errorCode = 'DATABASE_ERROR'
      statusCode = 500
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorCode = 'NETWORK_ERROR'
      statusCode = 503
    }

    return this.createError(errorCode, message, statusCode, {
      ...context,
      originalError: error.name,
      stack: error.stack,
    })
  }

  /**
   * Handles database-specific errors
   */
  static handleDatabaseError(error: Error, query?: string): ErrorDetails {
    let errorCode = 'DATABASE_ERROR'
    let message = 'Database operation failed'
    let statusCode = 500

    // Categorize database errors
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      errorCode = 'DUPLICATE_ENTRY'
      message = 'Resource already exists'
      statusCode = 409
    } else if (error.message.includes('foreign key')) {
      errorCode = 'FOREIGN_KEY_VIOLATION'
      message = 'Referenced resource does not exist'
      statusCode = 400
    } else if (error.message.includes('connection')) {
      errorCode = 'DATABASE_CONNECTION_ERROR'
      message = 'Database connection failed'
      statusCode = 503
    } else if (error.message.includes('timeout')) {
      errorCode = 'DATABASE_TIMEOUT'
      message = 'Database operation timed out'
      statusCode = 504
    }

    return this.createError(errorCode, message, statusCode, {
      query,
      originalError: error.message,
      stack: error.stack,
    })
  }

  /**
   * Handles authentication and authorization errors
   */
  static handleAuthError(type: 'invalid_token' | 'expired_token' | 'missing_token' | 'insufficient_permissions'): ErrorDetails {
    const authErrors = {
      invalid_token: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        statusCode: 401,
      },
      expired_token: {
        code: 'EXPIRED_TOKEN',
        message: 'Authentication token has expired',
        statusCode: 401,
      },
      missing_token: {
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required',
        statusCode: 401,
      },
      insufficient_permissions: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions for this action',
        statusCode: 403,
      },
    }

    const errorConfig = authErrors[type]
    return this.createError(errorConfig.code, errorConfig.message, errorConfig.statusCode)
  }

  /**
   * Handles validation errors with detailed field information
   */
  static handleValidationError(fields: Record<string, string[]>): ErrorDetails {
    const fieldErrors = Object.entries(fields)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ')

    return this.createError(
      'VALIDATION_ERROR',
      `Validation failed: ${fieldErrors}`,
      400,
      { fields }
    )
  }

  /**
   * Gets error statistics and trends
   */
  static getErrorStatistics(timeWindow: number = 3600000): {
    totalErrors: number
    errorsByCode: Record<string, number>
    errorsByStatusCode: Record<number, number>
    criticalErrors: number
    resolvedErrors: number
    averageResolutionTime: number
  } {
    const cutoff = Date.now() - timeWindow
    const recentErrors = this.errorLogs.filter(log => log.error.timestamp >= cutoff)

    const errorsByCode: Record<string, number> = {}
    const errorsByStatusCode: Record<number, number> = {}
    let criticalErrors = 0
    let resolvedErrors = 0
    let totalResolutionTime = 0

    recentErrors.forEach(log => {
      // Count by error code
      errorsByCode[log.error.code] = (errorsByCode[log.error.code] || 0) + 1

      // Count by status code
      errorsByStatusCode[log.error.statusCode] = (errorsByStatusCode[log.error.statusCode] || 0) + 1

      // Count critical errors (5xx status codes)
      if (log.error.statusCode >= 500) {
        criticalErrors++
      }

      // Count resolved errors and calculate resolution time
      if (log.resolved && log.resolvedAt) {
        resolvedErrors++
        totalResolutionTime += log.resolvedAt - log.error.timestamp
      }
    })

    const averageResolutionTime = resolvedErrors > 0 ? totalResolutionTime / resolvedErrors : 0

    return {
      totalErrors: recentErrors.length,
      errorsByCode,
      errorsByStatusCode,
      criticalErrors,
      resolvedErrors,
      averageResolutionTime,
    }
  }

  /**
   * Gets unresolved critical errors
   */
  static getCriticalErrors(): ErrorLog[] {
    return this.errorLogs.filter(log => 
      !log.resolved && log.error.statusCode >= 500
    ).sort((a, b) => b.error.timestamp - a.error.timestamp)
  }

  /**
   * Marks an error as resolved
   */
  static resolveError(errorId: string, resolvedBy: string, notes?: string): boolean {
    const errorLog = this.errorLogs.find(log => log.id === errorId)
    
    if (!errorLog) {
      return false
    }

    errorLog.resolved = true
    errorLog.resolvedAt = Date.now()
    errorLog.resolvedBy = resolvedBy
    errorLog.notes = notes

    return true
  }

  /**
   * Gets error trends for monitoring
   */
  static getErrorTrends(hours: number = 24): Array<{
    hour: number
    errorCount: number
    criticalCount: number
  }> {
    const trends: Array<{ hour: number; errorCount: number; criticalCount: number }> = []
    const now = Date.now()
    const hourMs = 3600000

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i * hourMs)
      const hourEnd = hourStart + hourMs

      const hourErrors = this.errorLogs.filter(log => 
        log.error.timestamp >= hourStart && log.error.timestamp < hourEnd
      )

      const criticalCount = hourErrors.filter(log => log.error.statusCode >= 500).length

      trends.push({
        hour: Math.floor(hourStart / hourMs),
        errorCount: hourErrors.length,
        criticalCount,
      })
    }

    return trends
  }

  /**
   * Handles errors based on severity level
   */
  private static handleErrorBySeverity(error: ErrorDetails): void {
    // Critical errors (5xx) - immediate attention needed
    if (error.statusCode >= 500) {
      this.handleCriticalError(error)
    }
    // Client errors (4xx) - log for analysis
    else if (error.statusCode >= 400) {
      this.handleClientError(error)
    }
  }

  /**
   * Handles critical errors with alerting
   */
  private static handleCriticalError(error: ErrorDetails): void {
    // In a real implementation, this would:
    // - Send alerts to monitoring systems
    // - Notify on-call engineers
    // - Create incident tickets
    console.error('CRITICAL ERROR:', {
      code: error.code,
      message: error.message,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context,
    })
  }

  /**
   * Handles client errors for analysis
   */
  private static handleClientError(error: ErrorDetails): void {
    // Log client errors for pattern analysis
    console.warn('CLIENT ERROR:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      userId: error.userId,
    })
  }

  /**
   * Generates unique error ID
   */
  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleans up old error logs to prevent memory leaks
   */
  private static cleanupOldLogs(): void {
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs = this.errorLogs.slice(-this.MAX_LOGS)
    }
  }

  /**
   * Resets all error logs (useful for testing)
   */
  static reset(): void {
    this.errorLogs = []
  }

  /**
   * Gets all error logs (for testing/debugging)
   */
  static getAllErrorLogs(): ErrorLog[] {
    return [...this.errorLogs]
  }
}