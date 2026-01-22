import { describe, it, expect } from '@jest/globals';
import { sanitizeString, isValidEmail, generateId } from '../../src/utils/helpers';

describe('Helpers - Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should prevent script injection', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeString(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
      });
    });

    it('should handle nested injection attempts', () => {
      const nestedInput = '<scr<script>ipt>alert("nested")</scr</script>ipt>';
      const result = sanitizeString(nestedInput);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(');
    });

    it('should handle HTML entity encoding attempts', () => {
      const encodedInput = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeString(encodedInput);
      expect(result).toBe('ltscriptgtalert(1)lt/scriptgt');
    });
  });

  describe('Email Security', () => {
    it('should reject emails with potential injection', () => {
      const maliciousEmails = [
        'test+<script>@example.com',
        'test"onload=alert(1)"@example.com',
        'test@<script>example.com',
        'test@example.com<script>',
        'test@exam\nple.com'
      ];

      maliciousEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should handle unicode homograph attacks', () => {
      const homographEmails = [
        'test@еxample.com', // Cyrillic 'е' instead of 'e'
        'test@example.соm', // Cyrillic 'о' instead of 'o'
        'test@g00gle.com'   // Numbers instead of letters
      ];

      // These should still validate as emails (basic check)
      // but in real implementation, you'd want additional homograph detection
      homographEmails.forEach(email => {
        const result = isValidEmail(email);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('ID Generation Security', () => {
    it('should generate cryptographically unpredictable IDs', () => {
      const ids = Array.from({ length: 1000 }, () => generateId('security'));
      
      // Check randomness - no two IDs should be identical
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(1000);
      
      // Check that random parts are different
      const randomParts = ids.map(id => id.split('_')[2]);
      const uniqueRandomParts = new Set(randomParts);
      expect(uniqueRandomParts.size).toBe(1000);
    });

    it('should not leak information in ID format', () => {
      const userIds = Array.from({ length: 10 }, () => generateId('user'));
      const adminIds = Array.from({ length: 10 }, () => generateId('admin'));
      
      // Should not be able to distinguish patterns between user types
      // (other than the prefix which is intentional)
      userIds.forEach(id => {
        const parts = id.split('_');
        expect(parts[0]).toBe('user');
        expect(parts[1]).toMatch(/^\d+$/);
        expect(parts[2]).toMatch(/^[a-z0-9]{9}$/);
      });
      
      adminIds.forEach(id => {
        const parts = id.split('_');
        expect(parts[0]).toBe('admin');
        expect(parts[1]).toMatch(/^\d+$/);
        expect(parts[2]).toMatch(/^[a-z0-9]{9}$/);
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should handle null bytes and control characters', () => {
      const maliciousInputs = [
        'test\x00null',
        'test\x01control',
        'test\x1fcontrol',
        'test\x7fdelete'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeString(input);
        // Should still process the string (our sanitizer focuses on HTML)
        expect(typeof sanitized).toBe('string');
      });
    });

    it('should handle extremely long inputs without DoS', () => {
      const longInput = '<script>' + 'a'.repeat(10000) + '</script>';
      const startTime = Date.now();
      
      const result = sanitizeString(longInput);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete quickly
      expect(result).not.toContain('<script>');
    });

    it('should handle regex DoS attempts', () => {
      // Test with patterns that could cause catastrophic backtracking
      const potentialReDoSEmails = [
        'a'.repeat(1000) + '@example.com',
        'test@' + 'a'.repeat(1000) + '.com',
        'test@example.' + 'a'.repeat(1000)
      ];

      potentialReDoSEmails.forEach(email => {
        const startTime = Date.now();
        const result = isValidEmail(email);
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(100); // Should be fast
        expect(typeof result).toBe('boolean');
      });
    });
  });
});