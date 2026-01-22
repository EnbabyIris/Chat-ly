import {
  validatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  generatePasswordSuggestion,
  PASSWORD_REQUIREMENTS,
} from '@/lib/utils/password'

describe('Password Utilities', () => {
  describe('validatePasswordStrength', () => {
    it('should validate a very weak password', () => {
      const result = validatePasswordStrength('123')

      expect(result.score).toBe(0)
      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must be at least 8 characters')
      expect(result.feedback).toContain('Password must contain at least one lowercase letter')
      expect(result.feedback).toContain('Password must contain at least one uppercase letter')
      expect(result.feedback).toContain('Password must contain at least one number')
    })

    it('should validate a weak password', () => {
      const result = validatePasswordStrength('password')

      expect(result.score).toBe(1) // Only length requirement met
      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must contain at least one uppercase letter')
      expect(result.feedback).toContain('Password must contain at least one number')
    })

    it('should validate a moderate password', () => {
      const result = validatePasswordStrength('Password1')

      expect(result.score).toBe(3) // Length, uppercase, lowercase, numbers all met
      expect(result.isValid).toBe(true)
      expect(result.feedback).toHaveLength(0)
    })

    it('should validate a strong password', () => {
      const result = validatePasswordStrength('VeryStrongPass123!')

      expect(result.score).toBe(3) // All basic requirements met
      expect(result.isValid).toBe(true)
    })

    it('should handle empty password', () => {
      const result = validatePasswordStrength('')

      expect(result.score).toBe(0)
      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must be at least 8 characters')
    })

    it('should reject password that is too long', () => {
      const longPassword = 'A'.repeat(101)
      const result = validatePasswordStrength(longPassword)

      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must be less than 100 characters')
    })

    it('should validate password with only numbers', () => {
      const result = validatePasswordStrength('12345678')

      expect(result.score).toBe(1) // Only length met
      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must contain at least one lowercase letter')
      expect(result.feedback).toContain('Password must contain at least one uppercase letter')
    })

    it('should validate password with only letters', () => {
      const result = validatePasswordStrength('Password')

      expect(result.score).toBe(2) // Length, uppercase, lowercase met
      expect(result.isValid).toBe(false)
      expect(result.feedback).toContain('Password must contain at least one number')
    })
  })

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels for different scores', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Very Weak')
      expect(getPasswordStrengthLabel(1)).toBe('Very Weak')
      expect(getPasswordStrengthLabel(2)).toBe('Weak')
      expect(getPasswordStrengthLabel(3)).toBe('Good')
      expect(getPasswordStrengthLabel(4)).toBe('Strong')
    })
  })

  describe('getPasswordStrengthColor', () => {
    it('should return correct colors for different scores', () => {
      expect(getPasswordStrengthColor(0)).toBe('text-red-500')
      expect(getPasswordStrengthColor(1)).toBe('text-red-500')
      expect(getPasswordStrengthColor(2)).toBe('text-orange-500')
      expect(getPasswordStrengthColor(3)).toBe('text-yellow-500')
      expect(getPasswordStrengthColor(4)).toBe('text-green-500')
    })
  })

  describe('generatePasswordSuggestion', () => {
    it('should provide helpful suggestions for weak passwords', () => {
      const suggestion = generatePasswordSuggestion('123')
      expect(suggestion).toContain('Add 5 more characters')
      expect(suggestion).toContain('Add an uppercase letter')
      expect(suggestion).toContain('Add a lowercase letter')
    })

    it('should congratulate strong passwords', () => {
      const suggestion = generatePasswordSuggestion('StrongPass123')
      expect(suggestion).toBe('Password is strong!')
    })

    it('should provide specific suggestions for partial passwords', () => {
      const suggestion = generatePasswordSuggestion('password')
      expect(suggestion).toContain('Add an uppercase letter')
      expect(suggestion).toContain('Add a number')
    })
  })

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should have correct default requirements', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8)
      expect(PASSWORD_REQUIREMENTS.maxLength).toBe(100)
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true)
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true)
      expect(PASSWORD_REQUIREMENTS.requireNumbers).toBe(true)
      expect(PASSWORD_REQUIREMENTS.requireSpecialChars).toBe(false)
    })
  })

  // F2P Test: Fail before fix, pass after
  describe('F2P: Password validation fixes', () => {
    it('should fail weak passwords that previously passed', () => {
      // This test demonstrates that our validation now catches weak passwords
      // that might have passed with less strict validation
      const weakPasswords = ['12345678', 'Password', 'password123']

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(false)
        expect(result.feedback.length).toBeGreaterThan(0)
      })
    })

    it('should pass strong passwords', () => {
      // This test verifies that good passwords still pass
      const strongPasswords = ['Password123', 'StrongPass456', 'GoodPass789']

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(true)
        expect(result.feedback.length).toBe(0)
      })
    })
  })

  // P2P Test: Regression protection
  describe('P2P: Regression protection', () => {
    it('should maintain existing validation behavior', () => {
      // This test ensures we don't break existing password validation
      const testCases = [
        { password: 'weak', expectedValid: false },
        { password: 'Password123', expectedValid: true },
        { password: 'short', expectedValid: false },
        { password: 'NOLOWERCASE123', expectedValid: false },
        { password: 'nouppercase123', expectedValid: false },
        { password: 'NoNumbers', expectedValid: false },
      ]

      testCases.forEach(({ password, expectedValid }) => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(expectedValid)
      })
    })

    it('should provide consistent feedback', () => {
      // Ensure feedback messages are consistent and helpful
      const result = validatePasswordStrength('123')

      expect(result.feedback).toContain('Password must be at least 8 characters')
      expect(result.feedback.length).toBeGreaterThan(0)
      expect(typeof result.feedback[0]).toBe('string')
    })
  })
})