import { describe, it, expect } from '@jest/globals';
import { isValidEmail } from '../../src/utils/helpers';

describe('Helpers - Email Validation', () => {
  it('should validate correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'admin+label@company.org',
      'firstname.lastname@subdomain.example.com',
      '123@numbers.net'
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
      'user.domain.com',
      'user@@domain.com',
      'user@domain..com',
      ''
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it('should handle emails with special characters', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.com')).toBe(true);
    expect(isValidEmail('user_name@example.com')).toBe(true);
  });

  it('should reject emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@ example.com')).toBe(false);
    expect(isValidEmail('user@example .com')).toBe(false);
  });

  it('should handle long domain names', () => {
    const longDomain = 'user@very.long.subdomain.example.com';
    expect(isValidEmail(longDomain)).toBe(true);
  });

  it('should handle single character domains', () => {
    expect(isValidEmail('user@a.b')).toBe(true);
  });
});