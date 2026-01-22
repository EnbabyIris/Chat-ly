import { describe, it, expect } from '@jest/globals';
import { validateMessageMetadata } from '../../src/utils/message-validator';

describe('Message Metadata Validation', () => {
  it('should validate complete metadata', () => {
    const metadata = { senderId: 'user123', chatId: 'chat456' };
    const result = validateMessageMetadata(metadata);
    expect(result.isValid).toBe(true);
  });

  it('should reject metadata without sender ID', () => {
    const metadata = { chatId: 'chat456' };
    const result = validateMessageMetadata(metadata);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Sender ID is required');
  });

  it('should reject metadata without chat ID', () => {
    const metadata = { senderId: 'user123' };
    const result = validateMessageMetadata(metadata);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Chat ID is required');
  });

  it('should handle empty metadata object', () => {
    const result = validateMessageMetadata({});
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
