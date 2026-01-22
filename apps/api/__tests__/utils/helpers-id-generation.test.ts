import { describe, it, expect } from '@jest/globals';
import { generateId } from '../../src/utils/helpers';

describe('Helpers - ID Generation', () => {
  it('should generate ID with default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^id_\d+_[a-z0-9]{9}$/);
  });

  it('should generate ID with custom prefix', () => {
    const id = generateId('user');
    expect(id).toMatch(/^user_\d+_[a-z0-9]{9}$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should handle empty prefix', () => {
    const id = generateId('');
    expect(id).toMatch(/^_\d+_[a-z0-9]{9}$/);
  });

  it('should handle special characters in prefix', () => {
    const id = generateId('test-prefix');
    expect(id).toMatch(/^test-prefix_\d+_[a-z0-9]{9}$/);
  });

  it('should generate IDs with different prefixes', () => {
    const userId = generateId('user');
    const taskId = generateId('task');
    const messageId = generateId('msg');
    
    expect(userId).toMatch(/^user_/);
    expect(taskId).toMatch(/^task_/);
    expect(messageId).toMatch(/^msg_/);
  });

  it('should include timestamp in ID', () => {
    const beforeTime = Date.now();
    const id = generateId('test');
    const afterTime = Date.now();
    
    const timestampPart = id.split('_')[1];
    const timestamp = parseInt(timestampPart);
    
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });
});