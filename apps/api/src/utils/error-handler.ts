/**
 * Comprehensive Error Handling System
 * Centralized error management, logging, and recovery
 */

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  context?: ErrorContext;
  stack?: string;
  cause?: Error;
  retryable?: boolean;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "AppError";
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.context = details.context;
    this.retryable = details.retryable || false;

    if (details.stack) {
      this.stack = details.stack;
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      retryable: this.retryable,
      timestamp: Date.now(),
    };
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Map<string, Function[]> = new Map();
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with context
   */
  handle(error: Error | AppError, context?: ErrorContext): AppError {
    const appError = this.normalizeError(error, context);

    this.incrementErrorCount(appError.code);
    this.logError(appError);
    this.notifyCallbacks(appError);

    return appError;
  }

  /**
   * Register error callback
   */
  onError(errorCode: string, callback: (error: AppError) => void): void {
    if (!this.errorCallbacks.has(errorCode)) {
      this.errorCallbacks.set(errorCode, []);
    }
    this.errorCallbacks.get(errorCode)!.push(callback);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Clear error statistics
   */
  clearStats(): void {
    this.errorCounts.clear();
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error | AppError): boolean {
    if (error instanceof AppError) {
      return error.retryable;
    }

    // Default retry logic for common errors
    const retryablePatterns = [
      /timeout/i,
      /connection/i,
      /network/i,
      /502/,
      /503/,
      /504/,
    ];

    return retryablePatterns.some(
      (pattern) => pattern.test(error.message) || pattern.test(error.name),
    );
  }

  /**
   * Create circuit breaker for error handling
   */
  createCircuitBreaker(
    errorThreshold: number = 5,
    resetTimeout: number = 60000,
  ) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: "closed" | "open" | "half-open" = "closed";

    return {
      execute: async <T>(fn: () => Promise<T>): Promise<T> => {
        const now = Date.now();

        if (state === "open") {
          if (now - lastFailureTime > resetTimeout) {
            state = "half-open";
          } else {
            throw new AppError({
              code: "CIRCUIT_BREAKER_OPEN",
              message: "Circuit breaker is open",
              statusCode: 503,
              retryable: true,
            });
          }
        }

        try {
          const result = await fn();

          if (state === "half-open") {
            state = "closed";
            failureCount = 0;
          }

          return result;
        } catch (error) {
          failureCount++;
          lastFailureTime = now;

          if (failureCount >= errorThreshold) {
            state = "open";
          }

          throw error;
        }
      },
      getState: () => ({ state, failureCount, lastFailureTime }),
    };
  }

  private normalizeError(
    error: Error | AppError,
    context?: ErrorContext,
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    let statusCode = 500;
    let code = "INTERNAL_ERROR";
    let retryable = false;

    // Map common error patterns
    if (error.message.includes("validation")) {
      statusCode = 400;
      code = "VALIDATION_ERROR";
    } else if (error.message.includes("unauthorized")) {
      statusCode = 401;
      code = "UNAUTHORIZED";
    } else if (error.message.includes("forbidden")) {
      statusCode = 403;
      code = "FORBIDDEN";
    } else if (error.message.includes("not found")) {
      statusCode = 404;
      code = "NOT_FOUND";
    } else if (error.message.includes("timeout")) {
      statusCode = 408;
      code = "TIMEOUT";
      retryable = true;
    } else if (error.message.includes("rate limit")) {
      statusCode = 429;
      code = "RATE_LIMITED";
      retryable = true;
    }

    return new AppError({
      code,
      message: error.message,
      statusCode,
      context,
      stack: error.stack,
      cause: error,
      retryable,
    });
  }

  private incrementErrorCount(code: string): void {
    const current = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, current + 1);
  }

  private logError(error: AppError): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: error.statusCode >= 500 ? "error" : "warn",
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.statusCode >= 500 ? error.stack : undefined,
    };

    console.error("[ErrorHandler]", JSON.stringify(logData));
  }

  private notifyCallbacks(error: AppError): void {
    const callbacks = this.errorCallbacks.get(error.code) || [];
    const allCallbacks = this.errorCallbacks.get("*") || [];

    [...callbacks, ...allCallbacks].forEach((callback) => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error("Error in error callback:", callbackError);
      }
    });
  }
}

/**
 * Express error middleware
 */
export const errorMiddleware = (
  error: Error,
  req: any,
  res: any,
  _next: any,
) => {
  const handler = ErrorHandler.getInstance();
  const context: ErrorContext = {
    requestId: req.id,
    endpoint: req.path,
    timestamp: Date.now(),
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: req.user?.id,
  };

  const appError = handler.handle(error, context);

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.statusCode < 500 && { context: appError.context }),
    },
  });
};

/**
 * Global error handler instance
 */
export const globalErrorHandler = ErrorHandler.getInstance();
