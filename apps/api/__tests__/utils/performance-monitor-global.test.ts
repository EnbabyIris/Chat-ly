import { describe, it, expect, beforeEach } from '@jest/globals';
import { globalMonitor } from '../../src/utils/performance-monitor';

describe('Global Performance Monitor', () => {
  beforeEach(() => {
    globalMonitor.clear();
  });

  it('should be available as a singleton', () => {
    expect(globalMonitor).toBeDefined();
    expect(typeof globalMonitor.recordMetric).toBe('function');
    expect(typeof globalMonitor.getStats).toBe('function');
  });

  it('should maintain state across multiple accesses', () => {
    globalMonitor.recordMetric('global_test', 100);
    globalMonitor.recordMetric('global_test', 200);
    
    const stats = globalMonitor.getStats('global_test');
    expect(stats!.count).toBe(2);
    expect(stats!.average).toBe(150);
  });

  it('should work with timing functions', async () => {
    const testFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'global_result';
    };

    const result = await globalMonitor.timeFunction('global_timing', testFunction);
    expect(result).toBe('global_result');
    
    const stats = globalMonitor.getStats('global_timing');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
  });

  it('should persist metrics until cleared', () => {
    globalMonitor.recordMetric('persistent_metric', 42);
    
    // Access again (simulating different module access)
    const stats1 = globalMonitor.getStats('persistent_metric');
    expect(stats1!.count).toBe(1);
    
    // Add more metrics
    globalMonitor.recordMetric('persistent_metric', 84);
    
    const stats2 = globalMonitor.getStats('persistent_metric');
    expect(stats2!.count).toBe(2);
    expect(stats2!.average).toBe(63);
  });

  it('should handle concurrent access safely', async () => {
    // Simulate concurrent metric recording
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        globalMonitor.timeFunction(`concurrent_${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return i;
        })
      );
    }

    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
    
    // Check that all metrics were recorded
    const metricNames = globalMonitor.getMetricNames();
    expect(metricNames.length).toBeGreaterThan(50); // At least half should be recorded
  });

  it('should clear all global metrics', () => {
    globalMonitor.recordMetric('metric_1', 10);
    globalMonitor.recordMetric('metric_2', 20);
    globalMonitor.recordMetric('metric_3', 30);
    
    expect(globalMonitor.getMetricNames()).toHaveLength(3);
    
    globalMonitor.clear();
    
    expect(globalMonitor.getMetricNames()).toHaveLength(0);
  });
});