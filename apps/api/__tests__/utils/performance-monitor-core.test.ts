import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Core', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should record metrics correctly', () => {
    monitor.recordMetric('test_metric', 100);
    monitor.recordMetric('test_metric', 200);
    
    const stats = monitor.getStats('test_metric');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(2);
    expect(stats!.average).toBe(150);
  });

  it('should calculate min and max correctly', () => {
    monitor.recordMetric('test_metric', 50);
    monitor.recordMetric('test_metric', 150);
    monitor.recordMetric('test_metric', 100);
    
    const stats = monitor.getStats('test_metric');
    expect(stats!.min).toBe(50);
    expect(stats!.max).toBe(150);
  });

  it('should calculate percentiles correctly', () => {
    // Record 100 values from 1 to 100
    for (let i = 1; i <= 100; i++) {
      monitor.recordMetric('test_metric', i);
    }
    
    const stats = monitor.getStats('test_metric');
    expect(stats!.p95).toBeGreaterThanOrEqual(95);
    expect(stats!.p99).toBeGreaterThanOrEqual(99);
  });

  it('should return null for non-existent metrics', () => {
    const stats = monitor.getStats('non_existent');
    expect(stats).toBeNull();
  });

  it('should clear all metrics', () => {
    monitor.recordMetric('test_metric', 100);
    expect(monitor.getMetricNames()).toContain('test_metric');
    
    monitor.clear();
    expect(monitor.getMetricNames()).toHaveLength(0);
  });
});