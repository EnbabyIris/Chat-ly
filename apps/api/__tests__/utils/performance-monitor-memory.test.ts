import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Memory Management', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should handle large number of metrics without memory issues', () => {
    // Record 10,000 metrics
    for (let i = 0; i < 10000; i++) {
      monitor.recordMetric('memory_test', Math.random() * 1000);
    }

    const stats = monitor.getStats('memory_test');
    expect(stats!.count).toBe(10000);
    expect(stats!.average).toBeGreaterThan(0);
  });

  it('should support multiple metric types simultaneously', () => {
    const metricTypes = ['db_query', 'api_call', 'file_io', 'cpu_usage', 'memory_usage'];
    
    metricTypes.forEach((metricType, index) => {
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric(metricType, (index + 1) * 100 + i);
      }
    });

    metricTypes.forEach((metricType) => {
      const stats = monitor.getStats(metricType);
      expect(stats!.count).toBe(100);
    });

    expect(monitor.getMetricNames()).toHaveLength(5);
  });

  it('should clear all metrics and free memory', () => {
    // Add many metrics
    for (let i = 0; i < 1000; i++) {
      monitor.recordMetric(`metric_${i}`, i);
    }

    expect(monitor.getMetricNames()).toHaveLength(1000);
    
    monitor.clear();
    
    expect(monitor.getMetricNames()).toHaveLength(0);
  });

  it('should handle metrics with same names but different values', () => {
    const values = [1, 5, 10, 15, 20, 25, 30];
    
    values.forEach(value => {
      monitor.recordMetric('duplicate_name', value);
    });

    const stats = monitor.getStats('duplicate_name');
    expect(stats!.count).toBe(values.length);
    expect(stats!.min).toBe(Math.min(...values));
    expect(stats!.max).toBe(Math.max(...values));
  });

  it('should maintain metric isolation', () => {
    monitor.recordMetric('isolated_metric_1', 100);
    monitor.recordMetric('isolated_metric_2', 200);
    
    const stats1 = monitor.getStats('isolated_metric_1');
    const stats2 = monitor.getStats('isolated_metric_2');
    
    expect(stats1!.average).toBe(100);
    expect(stats2!.average).toBe(200);
    expect(stats1!.count).toBe(1);
    expect(stats2!.count).toBe(1);
  });
});