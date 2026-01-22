import { describe, it, expect } from '@jest/globals';
import { validateMessageContent } from '../../src/utils/message-validator';

describe('Message Content Validation', () => {
  it('should validate non-empty message content', () => {
    const result = validateMessageContent('Hello world');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty message content', () => {
    const result = validateMessageContent('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Message content cannot be empty');
  });

  it('should reject messages exceeding maximum length', () => {
    const longMessage = 'a'.repeat(2001);
    const result = validateMessageContent(longMessage);
    expect(result.isValid).toBe(false);
  });

  it('should accept messages at maximum length', () => {
    const maxMessage = 'a'.repeat(2000);
    const result = validateMessageContent(maxMessage);
    expect(result.isValid).toBe(true);
  });

  it('should handle whitespace-only content', () => {
    const result = validateMessageContent('   ');
    expect(result.isValid).toBe(false);
  });
});
