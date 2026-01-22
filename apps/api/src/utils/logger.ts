import { createWriteStream } from 'fs'
import { join } from 'path'
import { format } from 'util'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: Record<string, any>
  error?: Error
}

class Logger {
  private level: LogLevel
  private logFile?: string
  private writeStream?: ReturnType<typeof createWriteStream>

  constructor(level: LogLevel = LogLevel.INFO, logFile?: string) {
    this.level = level
    this.logFile = logFile

    if (logFile) {
      const logPath = join(process.cwd(), logFile)
      this.writeStream = createWriteStream(logPath, { flags: 'a' })
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] ${levelName}: ${message}${metaStr}`
  }

  private writeToFile(message: string): void {
    if (this.writeStream) {
      this.writeStream.write(message + '\n')
    }
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, meta)

    // Console output with colors
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[35m', // Magenta
    }
    const resetColor = '\x1b[0m'

    const coloredMessage = `${colors[level]}${formattedMessage}${resetColor}`

    // Output to console
    if (level === LogLevel.ERROR) {
      console.error(coloredMessage)
      if (error) {
        console.error(error.stack)
      }
    } else if (level === LogLevel.WARN) {
      console.warn(coloredMessage)
    } else {
      console.log(coloredMessage)
    }

    // Write to file
    this.writeToFile(formattedMessage)
    if (error && this.writeStream) {
      this.writeStream.write(`Stack: ${error.stack}\n`)
    }

    // Send to monitoring service if configured
    this.sendToMonitoring(level, message, meta, error)
  }

  private sendToMonitoring(level: LogLevel, message: string, meta?: Record<string, any>, error?: Error): void {
    // Send to external monitoring service (e.g., Sentry, DataDog, etc.)
    if (process.env.SENTRY_DSN && level === LogLevel.ERROR) {
      // Sentry integration would go here
      console.log('Would send to Sentry:', { message, meta, error })
    }

    if (process.env.DATADOG_API_KEY) {
      // DataDog integration would go here
      console.log('Would send to DataDog:', { level, message, meta })
    }
  }

  error(message: string, meta?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, meta, error)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta)
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta)
  }

  // Request logging middleware
  requestLogger() {
    return (req: any, res: any, next: () => void) => {
      const start = Date.now()
      const { method, url, ip } = req

      // Log request start
      this.info(`Request started: ${method} ${url}`, {
        method,
        url,
        ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId || Math.random().toString(36).substr(2, 9),
      })

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start
        const { statusCode } = res

        const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
        const message = `Request completed: ${method} ${url} ${statusCode} (${duration}ms)`

        this.log(level, message, {
          method,
          url,
          statusCode,
          duration,
          ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
        })
      })

      next()
    }
  }

  // Performance monitoring
  time(label: string): () => void {
    const start = Date.now()
    this.debug(`Timer started: ${label}`)

    return () => {
      const duration = Date.now() - start
      this.debug(`Timer ended: ${label} (${duration}ms)`, { duration })

      // Log slow operations
      if (duration > 1000) {
        this.warn(`Slow operation detected: ${label} took ${duration}ms`, {
          label,
          duration,
          threshold: 1000,
        })
      }
    }
  }

  // Close file stream
  close(): void {
    if (this.writeStream) {
      this.writeStream.end()
    }
  }
}

// Create logger instance
const logLevel = process.env.LOG_LEVEL
  ? LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO
  : LogLevel.INFO

export const logger = new Logger(logLevel, process.env.LOG_FILE)

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down logger...')
  logger.close()
})

process.on('SIGTERM', () => {
  logger.info('Shutting down logger...')
  logger.close()
})

// Export types
export type { LogEntry }