import { MessageValidator } from '../src/utils/message-validator'

describe('MessageValidator - Comprehensive Testing', () => {
  // F2P Tests: Message validation was not implemented before
  describe('F2P: Message Security Validation', () => {
    it('should reject XSS attempts that would have succeeded before', () => {
      // F2P: These XSS attempts would have passed through before validation
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
      ]

      xssAttempts.forEach(maliciousContent => {
        const result = MessageValidator.validateMessage(maliciousContent, 'user123')
        
        // Before: malicious content would pass through
        // After: content is sanitized and warnings are generated
        expect(result.sanitizedContent).not.toContain('<script>')
        expect(result.sanitizedContent).not.toContain('javascript:')
        expect(result.sanitizedContent).not.toContain('onerror=')
        
        if (result.warnings.length > 0) {
          expect(result.warnings).toContain('HTML content has been sanitized for security')
        }
      })
    })

    it('should detect SQL injection attempts that were undetected before', () => {
      // F2P: SQL injection attempts would not be caught before
      const sqlInjectionAttempts = [
        "'; DROP TABLE messages; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "1; DELETE FROM messages WHERE id > 0",
      ]

      sqlInjectionAttempts.forEach(maliciousContent => {
        const result = MessageValidator.validateMessage(maliciousContent, 'user123')
        
        // Before: SQL injection would pass through undetected
        // After: SQL injection is detected and blocked
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Message contains potentially harmful content')
      })
    })

    it('should enforce message length limits that were missing before', () => {
      // F2P: Length validation was not enforced before
      const tooLongMessage = 'A'.repeat(5001) // Exceeds 5000 char limit
      const emptyMessage = ''
      const whitespaceMessage = '   '

      // Test overly long message
      const longResult = MessageValidator.validateMessage(tooLongMessage, 'user123')
      expect(longResult.isValid).toBe(false)
      expect(longResult.errors).toContain('Message exceeds maximum length of 5000 characters')

      // Test empty message
      const emptyResult = MessageValidator.validateMessage(emptyMessage, 'user123')
      expect(emptyResult.isValid).toBe(false)
      expect(emptyResult.errors).toContain('Message cannot be empty')

      // Test whitespace-only message
      const whitespaceResult = MessageValidator.validateMessage(whitespaceMessage, 'user123')
      expect(whitespaceResult.isValid).toBe(false)
      expect(whitespaceResult.errors).toContain('Message cannot be empty')
    })
  })

  // P2P Tests: Ensure existing functionality still works
  describe('P2P: Regression Protection Tests', () => {
    it('should allow valid messages to pass through unchanged', () => {
      // P2P: Valid messages should continue to work as before
      const validMessages = [
        'Hello, how are you?',
        'This is a normal message with some text.',
        'Message with numbers 123 and symbols !@#',
        'Multi-line\nmessage\nwith\nbreaks',
      ]

      validMessages.forEach(validContent => {
        const result = MessageValidator.validateMessage(validContent, 'user123')
        
        // Ensure valid messages still pass
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.sanitizedContent).toBe(validContent)
      })
    })

    it('should preserve existing MessageValidator API', () => {
      // P2P: Ensure the API hasn't changed in breaking ways
      expect(typeof MessageValidator.validateMessage).toBe('function')
      expect(typeof MessageValidator.validateMessageFormat).toBe('function')
      expect(typeof MessageValidator.extractAndValidateUrls).toBe('function')

      // Test that the function signatures work as expected
      const result = MessageValidator.validateMessage('test', 'user123')
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('sanitizedContent')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
    })

    it('should maintain backward compatibility with options', () => {
      // P2P: Options should work as before
      const message = 'Test message'
      const options = {
        maxLength: 100,
        minLength: 1,
        allowHtml: false,
      }

      const result = MessageValidator.validateMessage(message, 'user123', options)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedContent).toBe(message)
    })
  })

  // Additional comprehensive coverage
  describe('Message Format Validation', () => {
    it('should validate different message types correctly', () => {
      // Text messages
      expect(MessageValidator.validateMessageFormat('Hello world', 'text')).toBe(true)
      expect(MessageValidator.validateMessageFormat('', 'text')).toBe(false)
      expect(MessageValidator.validateMessageFormat('   ', 'text')).toBe(false)

      // Image messages
      expect(MessageValidator.validateMessageFormat('image.jpg', 'image')).toBe(true)
      expect(MessageValidator.validateMessageFormat('photo.png', 'image')).toBe(true)
      expect(MessageValidator.validateMessageFormat('document.pdf', 'image')).toBe(false)

      // File messages
      expect(MessageValidator.validateMessageFormat('document.pdf', 'file')).toBe(true)
      expect(MessageValidator.validateMessageFormat('data.xlsx', 'file')).toBe(true)
      expect(MessageValidator.validateMessageFormat('noextension', 'file')).toBe(false)
    })

    it('should extract and validate URLs correctly', () => {
      const messageWithUrls = 'Check out https://example.com and http://test.org and invalid://bad-url'
      
      const result = MessageValidator.extractAndValidateUrls(messageWithUrls)
      
      expect(result.valid).toContain('https://example.com')
      expect(result.valid).toContain('http://test.org')
      expect(result.invalid).toContain('invalid://bad-url')
    })
  })

  // Spam Detection Tests
  describe('Spam Detection', () => {
    it('should detect repetitive spam content', () => {
      const spamMessage = 'buy buy buy buy buy buy now now now now now'
      const result = MessageValidator.validateMessage(spamMessage, 'user123')
      
      expect(result.warnings).toContain('Message flagged as potential spam')
    })

    it('should detect excessive capitalization', () => {
      const capsMessage = 'THIS IS ALL CAPS MESSAGE THAT LOOKS LIKE SPAM'
      const result = MessageValidator.validateMessage(capsMessage, 'user123')
      
      expect(result.warnings).toContain('Message flagged as potential spam')
    })

    it('should allow normal messages with some caps', () => {
      const normalMessage = 'This is a Normal message with Some CAPS'
      const result = MessageValidator.validateMessage(normalMessage, 'user123')
      
      expect(result.warnings).not.toContain('Message flagged as potential spam')
    })
  })

  // Performance Tests
  describe('Performance Validation', () => {
    it('should validate messages quickly', () => {
      const message = 'This is a test message for performance validation'
      const startTime = performance.now()
      
      MessageValidator.validateMessage(message, 'user123')
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete validation in under 10ms
      expect(duration).toBeLessThan(10)
    })

    it('should handle large messages efficiently', () => {
      const largeMessage = 'A'.repeat(4000) // Large but valid message
      const startTime = performance.now()
      
      const result = MessageValidator.validateMessage(largeMessage, 'user123')
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(result.isValid).toBe(true)
      expect(duration).toBeLessThan(50) // Should still be fast
    })
  })

  // Edge Cases
  describe('Edge Case Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(() => {
        MessageValidator.validateMessage(null as any, 'user123')
      }).not.toThrow()

      expect(() => {
        MessageValidator.validateMessage(undefined as any, 'user123')
      }).not.toThrow()
    })

    it('should handle special characters correctly', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const result = MessageValidator.validateMessage(specialChars, 'user123')
      
      expect(result.isValid).toBe(true)
      expect(result.sanitizedContent).toBe(specialChars)
    })

    it('should handle unicode characters', () => {
      const unicodeMessage = '🚀 Hello 世界 🌟 Emoji test'
      const result = MessageValidator.validateMessage(unicodeMessage, 'user123')
      
      expect(result.isValid).toBe(true)
      expect(result.sanitizedContent).toBe(unicodeMessage)
    })
  })
})