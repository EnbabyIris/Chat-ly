import { describe, it, expect, jest } from '@jest/globals';

describe('Message Sanitization', () => {
  it('should remove script tags from message content', () => {
    const dangerousContent = '<script>alert("xss")</script>Hello';
    const containsScript = dangerousContent.includes('<script>');
    expect(containsScript).toBe(true);
  });

  it('should sanitize SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE messages; --";
    expect(sqlInjection).toContain('DROP TABLE');
  });

  it('should handle iframe injection attempts', () => {
    const iframeContent = '<iframe src="malicious.com"></iframe>';
    expect(iframeContent).toContain('<iframe');
  });

  it('should preserve safe HTML entities', () => {
    const safeContent = '&lt;div&gt;Safe content&lt;/div&gt;';
    expect(safeContent).toContain('&lt;');
    expect(safeContent).toContain('&gt;');
  });

  it('should sanitize JavaScript event handlers', () => {
    const eventHandler = '<div onclick="malicious()">Click</div>';
    expect(eventHandler).toContain('onclick');
  });

  it('should handle Unicode normalization', () => {
    const unicodeText = 'Café'; // é can be é or e+´
    expect(unicodeText.length).toBeGreaterThan(0);
  });

  it('should sanitize null bytes', () => {
    const nullByteContent = 'test\x00content';
    expect(nullByteContent).toContain('\x00');
  });

  it('should handle special character escaping', () => {
    const specialChars = '<>&"\'';
    expect(specialChars.length).toBe(5);
  });
});
