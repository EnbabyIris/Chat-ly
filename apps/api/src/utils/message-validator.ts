import DOMPurify from 'isomorphic-dompurify'

export interface MessageValidationResult {
  isValid: boolean
  sanitizedContent: string
  errors: string[]
  warnings: string[]
}

export interface MessageValidationOptions {
  maxLength: number
  minLength: number
  allowHtml: boolean
  allowLinks: boolean
  rateLimitCheck: boolean
}

export class MessageValidator {
  private static readonly DEFAULT_OPTIONS: MessageValidationOptions = {
    maxLength: 5000,
    minLength: 1,
    allowHtml: false,
    allowLinks: true,
    rateLimitCheck: true,
  }

  /**
   * Validates and sanitizes message content
   */
  static validateMessage(
    content: string,
    userId: string,
    options: Partial<MessageValidationOptions> = {}
  ): MessageValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const errors: string[] = []
    const warnings: string[] = []

    // Length validation
    if (!content || content.trim().length < opts.minLength) {
      errors.push('Message cannot be empty')
    }

    if (content.length > opts.maxLength) {
      errors.push(`Message exceeds maximum length of ${opts.maxLength} characters`)
    }

    // XSS Protection - sanitize content
    let sanitizedContent = content
    if (!opts.allowHtml) {
      sanitizedContent = this.sanitizeHtml(content)
      if (sanitizedContent !== content) {
        warnings.push('HTML content has been sanitized for security')
      }
    }

    // SQL Injection Protection
    if (this.containsSqlInjection(content)) {
      errors.push('Message contains potentially harmful content')
    }

    // Spam Detection
    if (this.isSpamContent(content)) {
      warnings.push('Message flagged as potential spam')
    }

    // Rate Limiting Check (mock implementation)
    if (opts.rateLimitCheck && this.exceedsRateLimit(userId)) {
      errors.push('Rate limit exceeded. Please wait before sending another message')
    }

    return {
      isValid: errors.length === 0,
      sanitizedContent,
      errors,
      warnings,
    }
  }

  /**
   * Sanitizes HTML content to prevent XSS attacks
   */
  private static sanitizeHtml(content: string): string {
    // Remove script tags and dangerous attributes
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/<object\b[^>]*>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
  }

  /**
   * Detects potential SQL injection attempts
   */
  private static containsSqlInjection(content: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\*\/|\/\*)/,
      /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
      /('.*'.*=.*'.*'|".*".*=.*".*")/,
    ]

    return sqlPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Basic spam detection
   */
  private static isSpamContent(content: string): boolean {
    // Check for excessive repetition
    const words = content.toLowerCase().split(/\s+/)
    const wordCount = new Map<string, number>()
    
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    }

    // Flag if any word appears more than 5 times
    for (const count of wordCount.values()) {
      if (count > 5) {
        return true
      }
    }

    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (upperCaseRatio > 0.7 && content.length > 10) {
      return true
    }

    return false
  }

  /**
   * Mock rate limiting check
   */
  private static exceedsRateLimit(userId: string): boolean {
    // In real implementation, this would check Redis/database
    // For now, return false to allow messages
    return false
  }

  /**
   * Validates message format for different types
   */
  static validateMessageFormat(content: string, messageType: 'text' | 'image' | 'file'): boolean {
    switch (messageType) {
      case 'text':
        return content.trim().length > 0
      case 'image':
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(content)
      case 'file':
        return content.includes('.') && content.length > 0
      default:
        return false
    }
  }

  /**
   * Extracts and validates URLs in message content
   */
  static extractAndValidateUrls(content: string): { valid: string[]; invalid: string[] } {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = content.match(urlRegex) || []
    const valid: string[] = []
    const invalid: string[] = []

    for (const url of urls) {
      try {
        new URL(url)
        valid.push(url)
      } catch {
        invalid.push(url)
      }
    }

    return { valid, invalid }
  }
}