import { describe, it, expect } from '@jest/globals';
import { formatTimestamp } from '../../src/utils/helpers';

describe('Helpers - Timestamp Formatting', () => {
  it('should format timestamp to ISO string', () => {
    const timestamp = 1640995200000; // 2022-01-01T00:00:00.000Z
    const result = formatTimestamp(timestamp);
    expect(result).toBe('2022-01-01T00:00:00.000Z');
  });

  it('should handle current timestamp', () => {
    const now = Date.now();
    const result = formatTimestamp(now);
    const expectedDate = new Date(now).toISOString();
    expect(result).toBe(expectedDate);
  });

  it('should handle zero timestamp', () => {
    const result = formatTimestamp(0);
    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });

  it('should handle negative timestamp', () => {
    const timestamp = -86400000; // One day before epoch
    const result = formatTimestamp(timestamp);
    expect(result).toBe('1969-12-31T00:00:00.000Z');
  });

  it('should handle large timestamp', () => {
    const timestamp = 4102444800000; // 2100-01-01T00:00:00.000Z
    const result = formatTimestamp(timestamp);
    expect(result).toBe('2100-01-01T00:00:00.000Z');
  });

  it('should handle millisecond precision', () => {
    const timestamp = 1640995200123; // 2022-01-01T00:00:00.123Z
    const result = formatTimestamp(timestamp);
    expect(result).toBe('2022-01-01T00:00:00.123Z');
  });
});