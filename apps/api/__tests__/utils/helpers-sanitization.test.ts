import { describe, it, expect } from '@jest/globals';
import { sanitizeString } from '../../src/utils/helpers';

describe('Helpers - String Sanitization', () => {
  it('should remove HTML tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizeString(input);
    expect(result).toBe('Hello scriptalert(xss)/script World');
  });

  it('should remove dangerous characters', () => {
    const input = 'Test "quotes" and \'single quotes\'';
    const result = sanitizeString(input);
    expect(result).toBe('Test quotes and single quotes');
  });

  it('should remove ampersands', () => {
    const input = 'Tom & Jerry';
    const result = sanitizeString(input);
    expect(result).toBe('Tom  Jerry');
  });

  it('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });

  it('should handle clean string', () => {
    const input = 'This is a clean string';
    const result = sanitizeString(input);
    expect(result).toBe(input);
  });

  it('should remove multiple dangerous characters', () => {
    const input = '<div>"Hello" & \'World\'</div>';
    const result = sanitizeString(input);
    expect(result).toBe('divHello  World/div');
  });

  it('should handle numbers and special characters', () => {
    const input = 'Price: $50.99 (20% off)';
    const result = sanitizeString(input);
    expect(result).toBe('Price: $50.99 (20% off)');
  });
});