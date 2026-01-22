import { describe, it, expect } from '@jest/globals';
import { formatTimestamp, generateId, sanitizeString, isValidEmail } from '../../src/utils/helpers';

describe('Helpers - Performance Tests', () => {
  it('should handle large volume ID generation efficiently', () => {
    const startTime = Date.now();
    const ids = [];
    
    for (let i = 0; i < 1000; i++) {
      ids.push(generateId('perf'));
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(ids).toHaveLength(1000);
  });

  it('should handle bulk timestamp formatting efficiently', () => {
    const timestamps = Array.from({ length: 1000 }, (_, i) => Date.now() + i * 1000);
    const startTime = Date.now();
    
    const formatted = timestamps.map(formatTimestamp);
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(500);
    expect(formatted).toHaveLength(1000);
    formatted.forEach(timestamp => {
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  it('should handle bulk email validation efficiently', () => {
    const emails = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
    const startTime = Date.now();
    
    const results = emails.map(isValidEmail);
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(500);
    expect(results.every(result => result === true)).toBe(true);
  });

  it('should handle bulk sanitization efficiently', () => {
    const dirtyStrings = Array.from({ length: 1000 }, (_, i) => 
      `String ${i} with <script>alert(${i})</script> and "quotes"`
    );
    
    const startTime = Date.now();
    const sanitized = dirtyStrings.map(sanitizeString);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(500);
    expect(sanitized).toHaveLength(1000);
    sanitized.forEach((str, i) => {
      expect(str).toBe(`String ${i} with scriptalert(${i})/script and quotes`);
    });
  });

  it('should maintain performance with concurrent operations', async () => {
    const operations = Array.from({ length: 100 }, async (_, i) => {
      const id = generateId(`concurrent-${i}`);
      const timestamp = formatTimestamp(Date.now() + i);
      const sanitized = sanitizeString(`<script>test${i}</script>`);
      const emailValid = isValidEmail(`test${i}@example.com`);
      
      return { id, timestamp, sanitized, emailValid };
    });
    
    const startTime = Date.now();
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(1000);
    expect(results).toHaveLength(100);
    
    results.forEach((result, i) => {
      expect(result.id).toMatch(new RegExp(`^concurrent-${i}_\\d+_[a-z0-9]{9}$`));
      expect(result.sanitized).toBe(`scripttest${i}/script`);
      expect(result.emailValid).toBe(true);
    });
  });
});