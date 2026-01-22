import { Request, Response, NextFunction } from 'express'
import { JSDOM } from 'jsdom'

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Skip sanitization for file uploads and binary data
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next()
  }

  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str

    // Remove potential XSS vectors
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .trim()
  }

  const sanitizeObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }

    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  // Sanitize request body, query, and params
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query)
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params)
  }

  next()
}

// Request size limiting middleware
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0')

    if (contentLength > parseSize(maxSize)) {
      res.status(413).json({
        success: false,
        error: 'Request entity too large',
        message: `Request size exceeds maximum allowed size of ${maxSize}`
      })
      return
    }

    next()
  }
}

// Parse size string to bytes
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/)
  if (!match) return 1024 * 1024 // Default 1MB

  const value = parseFloat(match[1])
  const unit = match[2] || 'b'

  return Math.floor(value * units[unit])
}

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction): void => {
  const version = req.headers['accept-version'] || req.headers['api-version'] || 'v1'

  // Add version to request object
  req.apiVersion = version as string

  // Add version to response headers
  res.setHeader('api-version', version)

  next()
}

// Security headers middleware (additional to helmet)
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy (restrict features)
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: `Request took longer than ${timeoutMs}ms to process`
        })
      }
    }, timeoutMs)

    res.on('finish', () => clearTimeout(timeout))
    res.on('close', () => clearTimeout(timeout))

    next()
  }
}

// SQL injection detection middleware (additional layer)
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(#)|(\%27)|(\%22)|(\%23)|(\%2D\\x2D))/i,
    /(<script|javascript:|vbscript:|onload=|onerror=)/i,
    /(\bOR\b|\bAND\b).*(\=|\<|\>)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(#))/i
  ]

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue)
    }
    return false
  }

  const hasSuspiciousContent =
    checkValue(req.body) ||
    checkValue(req.query) ||
    checkValue(req.params)

  if (hasSuspiciousContent) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Request contains potentially malicious content'
    })
    return
  }

  next()
}

// Log security events
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode

    // Log suspicious activities
    if (statusCode === 429) {
      console.warn(`🚨 Rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`)
    } else if (statusCode === 401) {
      console.warn(`🔐 Unauthorized access attempt: ${req.ip} - ${req.method} ${req.path}`)
    } else if (statusCode >= 400 && statusCode < 500) {
      console.info(`⚠️ Client error: ${statusCode} - ${req.method} ${req.path} (${duration}ms)`)
    }

    // Log slow requests (>5 seconds)
    if (duration > 5000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`)
    }
  })

  next()
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string
      requestTime?: string
    }
  }
}