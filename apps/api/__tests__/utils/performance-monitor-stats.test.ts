import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Statistics', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should calculate accurate statistics for uniform data', () => {
    // Add uniform data
    for (let i = 1; i <= 10; i++) {
      monitor.recordMetric('uniform_data', i * 10); // 10, 20, 30... 100
    }

    const stats = monitor.getStats('uniform_data');
    expect(stats!.count).toBe(10);
    expect(stats!.min).toBe(10);
    expect(stats!.max).toBe(100);
    expect(stats!.average).toBe(55);
  });

  it('should handle single value statistics', () => {
    monitor.recordMetric('single_value', 42);

    const stats = monitor.getStats('single_value');
    expect(stats!.count).toBe(1);
    expect(stats!.min).toBe(42);
    expect(stats!.max).toBe(42);
    expect(stats!.average).toBe(42);
    expect(stats!.p95).toBe(42);
    expect(stats!.p99).toBe(42);
  });

  it('should calculate percentiles for large datasets', () => {
    // Add 1000 values
    for (let i = 1; i <= 1000; i++) {
      monitor.recordMetric('large_dataset', i);
    }

    const stats = monitor.getStats('large_dataset');
    expect(stats!.count).toBe(1000);
    expect(stats!.p95).toBeGreaterThanOrEqual(950);
    expect(stats!.p99).toBeGreaterThanOrEqual(990);
  });

  it('should handle extreme values', () => {
    monitor.recordMetric('extreme_values', 1);
    monitor.recordMetric('extreme_values', 1000000);
    monitor.recordMetric('extreme_values', 500000);

    const stats = monitor.getStats('extreme_values');
    expect(stats!.min).toBe(1);
    expect(stats!.max).toBe(1000000);
    expect(stats!.count).toBe(3);
  });

  it('should maintain separate statistics for different metrics', () => {
    monitor.recordMetric('metric_a', 100);
    monitor.recordMetric('metric_b', 200);
    monitor.recordMetric('metric_a', 300);

    const statsA = monitor.getStats('metric_a');
    const statsB = monitor.getStats('metric_b');

    expect(statsA!.count).toBe(2);
    expect(statsA!.average).toBe(200);

    expect(statsB!.count).toBe(1);
    expect(statsB!.average).toBe(200);
  });
});