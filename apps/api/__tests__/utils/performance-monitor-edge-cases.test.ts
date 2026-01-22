import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Edge Cases', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should handle zero values', () => {
    monitor.recordMetric('zero_test', 0);
    monitor.recordMetric('zero_test', 0);
    
    const stats = monitor.getStats('zero_test');
    expect(stats!.average).toBe(0);
    expect(stats!.min).toBe(0);
    expect(stats!.max).toBe(0);
    expect(stats!.count).toBe(2);
  });

  it('should handle negative values', () => {
    monitor.recordMetric('negative_test', -100);
    monitor.recordMetric('negative_test', -50);
    monitor.recordMetric('negative_test', -200);
    
    const stats = monitor.getStats('negative_test');
    expect(stats!.min).toBe(-200);
    expect(stats!.max).toBe(-50);
    expect(stats!.average).toBe(-350/3);
  });

  it('should handle very large numbers', () => {
    const largeNumber = Number.MAX_SAFE_INTEGER;
    monitor.recordMetric('large_test', largeNumber);
    
    const stats = monitor.getStats('large_test');
    expect(stats!.average).toBe(largeNumber);
    expect(stats!.max).toBe(largeNumber);
  });

  it('should handle decimal precision', () => {
    monitor.recordMetric('decimal_test', 1.23456789);
    monitor.recordMetric('decimal_test', 2.34567891);
    
    const stats = monitor.getStats('decimal_test');
    expect(stats!.count).toBe(2);
    expect(stats!.min).toBeCloseTo(1.23456789, 8);
    expect(stats!.max).toBeCloseTo(2.34567891, 8);
  });

  it('should handle empty metric names gracefully', () => {
    monitor.recordMetric('', 100);
    
    const stats = monitor.getStats('');
    expect(stats!.count).toBe(1);
    expect(monitor.getMetricNames()).toContain('');
  });

  it('should handle special characters in metric names', () => {
    const specialName = 'metric@#$%^&*()_+-=[]{}|;:,.<>?';
    monitor.recordMetric(specialName, 42);
    
    const stats = monitor.getStats(specialName);
    expect(stats!.average).toBe(42);
    expect(monitor.getMetricNames()).toContain(specialName);
  });

  it('should handle mixed positive and negative values', () => {
    const values = [-100, -50, 0, 50, 100];
    values.forEach(value => {
      monitor.recordMetric('mixed_values', value);
    });
    
    const stats = monitor.getStats('mixed_values');
    expect(stats!.min).toBe(-100);
    expect(stats!.max).toBe(100);
    expect(stats!.average).toBe(0);
    expect(stats!.count).toBe(5);
  });
});