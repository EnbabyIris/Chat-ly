import { describe, it, expect } from '@jest/globals';
import { formatTimestamp, generateId, sanitizeString, isValidEmail } from '../../src/utils/helpers';

describe('Helpers - Integration Tests', () => {
  it('should work together in user registration flow', () => {
    // Simulate user registration process
    const userEmail = 'newuser@example.com';
    const userName = sanitizeString('John<script>alert(1)</script>Doe');
    const userId = generateId('user');
    const timestamp = formatTimestamp(Date.now());

    expect(isValidEmail(userEmail)).toBe(true);
    expect(userName).toBe('JohnscriptalertDoe');
    expect(userId).toMatch(/^user_\d+_[a-z0-9]{9}$/);
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle data processing pipeline', () => {
    const rawData = [
      { email: 'user1@test.com', name: 'User<div>One</div>' },
      { email: 'user2@test.com', name: 'User&Two' },
      { email: 'invalid-email', name: 'User"Three"' }
    ];

    const processedData = rawData.map(user => ({
      id: generateId('user'),
      email: user.email,
      name: sanitizeString(user.name),
      isValidEmail: isValidEmail(user.email),
      createdAt: formatTimestamp(Date.now())
    }));

    expect(processedData).toHaveLength(3);
    expect(processedData[0].name).toBe('UserdivOne/div');
    expect(processedData[1].name).toBe('UserTwo');
    expect(processedData[2].name).toBe('UserThree');
    expect(processedData[0].isValidEmail).toBe(true);
    expect(processedData[2].isValidEmail).toBe(false);
  });

  it('should handle bulk ID generation', () => {
    const ids = Array.from({ length: 100 }, () => generateId('bulk'));
    
    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);

    // All IDs should follow pattern
    ids.forEach(id => {
      expect(id).toMatch(/^bulk_\d+_[a-z0-9]{9}$/);
    });
  });

  it('should handle mixed data types gracefully', () => {
    const mixedInputs = [
      'normal@email.com',
      'with<script>tag@email.com',
      '',
      'test"quote@email.com'
    ];

    const results = mixedInputs.map(input => ({
      original: input,
      sanitized: sanitizeString(input),
      isValid: isValidEmail(input),
      id: generateId('mixed'),
      timestamp: formatTimestamp(Date.now())
    }));

    expect(results[0].isValid).toBe(true);
    expect(results[1].sanitized).toBe('withscripttagmail.com');
    expect(results[2].isValid).toBe(false);
    expect(results[3].sanitized).toBe('testquotemail.com');
  });

  it('should maintain consistency across multiple calls', () => {
    const baseTimestamp = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const id = generateId('consistent');
      const formatted = formatTimestamp(baseTimestamp + i * 1000);
      const sanitized = sanitizeString(`test${i}<script>alert(${i})</script>`);
      const emailValid = isValidEmail(`user${i}@test.com`);

      expect(id).toMatch(/^consistent_\d+_[a-z0-9]{9}$/);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(sanitized).toBe(`test${i}scriptalert(${i})/script`);
      expect(emailValid).toBe(true);
    }
  });
});