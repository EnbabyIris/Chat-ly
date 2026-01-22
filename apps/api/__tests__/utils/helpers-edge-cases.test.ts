import { describe, it, expect } from '@jest/globals';
import { formatTimestamp, generateId, sanitizeString, isValidEmail } from '../../src/utils/helpers';

describe('Helpers - Edge Cases', () => {
  describe('formatTimestamp edge cases', () => {
    it('should handle extremely large numbers', () => {
      const result = formatTimestamp(Number.MAX_SAFE_INTEGER);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle decimal timestamps', () => {
      const result = formatTimestamp(1640995200500.5);
      expect(result).toBe('2022-01-01T00:00:00.500Z');
    });
  });

  describe('generateId edge cases', () => {
    it('should handle unicode prefix', () => {
      const id = generateId('测试');
      expect(id).toMatch(/^测试_\d+_[a-z0-9]{9}$/);
    });

    it('should handle very long prefix', () => {
      const longPrefix = 'a'.repeat(100);
      const id = generateId(longPrefix);
      expect(id).toMatch(new RegExp(`^${longPrefix}_\\d+_[a-z0-9]{9}$`));
    });
  });

  describe('sanitizeString edge cases', () => {
    it('should handle strings with only dangerous characters', () => {
      const result = sanitizeString('<>&"\'');
      expect(result).toBe('');
    });

    it('should handle repeated dangerous characters', () => {
      const result = sanitizeString('<<<>>>"""\'\'\'&&&');
      expect(result).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000) + '<script>' + 'b'.repeat(1000);
      const result = sanitizeString(longString);
      expect(result).toBe('a'.repeat(1000) + 'script' + 'b'.repeat(1000));
    });
  });

  describe('isValidEmail edge cases', () => {
    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      expect(isValidEmail(longEmail)).toBe(true);
    });

    it('should handle emails with consecutive dots in domain', () => {
      expect(isValidEmail('user@domain..com')).toBe(false);
    });

    it('should handle emails starting or ending with dots', () => {
      expect(isValidEmail('user@.domain.com')).toBe(false);
      expect(isValidEmail('user@domain.com.')).toBe(false);
    });
  });
});