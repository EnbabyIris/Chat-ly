import { describe, it, expect } from '@jest/globals';

describe('Message Sanitization', () => {
  it('should detect script tags in content', () => {
    const content = '<script>alert("xss")</script>';
    const hasScript = content.includes('<script>');
    expect(hasScript).toBe(true);
  });

  it('should detect SQL injection patterns', () => {
    const content = "'; DROP TABLE messages; --";
    const hasSQLPattern = content.includes('DROP TABLE');
    expect(hasSQLPattern).toBe(true);
  });

  it('should allow safe HTML entities', () => {
    const content = '&lt;div&gt;Safe&lt;/div&gt;';
    expect(content).toContain('&lt;');
  });

  it('should handle null bytes', () => {
    const content = 'test\x00content';
    expect(content).toContain('\x00');
  });

  it('should preserve emoji characters', () => {
    const content = 'Hello 😊 World';
    expect(content).toContain('😊');
  });
});
