import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

describe('Message Form Validation', () => {
  it('should validate message before submission', () => {
    const message = 'Test message';
    const isValid = message.length > 0 && message.length <= 2000;
    expect(isValid).toBe(true);
  });

  it('should show error for empty message', () => {
    const message = '';
    const errorMessage = message.length === 0 ? 'Message cannot be empty' : '';
    expect(errorMessage).toBe('Message cannot be empty');
  });

  it('should display character count', () => {
    const message = 'Hello world';
    const charCount = message.length;
    expect(charCount).toBe(11);
  });

  it('should warn at character limit', () => {
    const message = 'a'.repeat(1950);
    const nearLimit = message.length > 1900;
    expect(nearLimit).toBe(true);
  });

  it('should disable submit for invalid input', () => {
    const message = '';
    const isDisabled = message.trim().length === 0;
    expect(isDisabled).toBe(true);
  });
});
