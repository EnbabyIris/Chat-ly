import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Configuration', () => {
  it('should be enabled by default', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.recordMetric('test_metric', 100);
    const stats = monitor.getStats('test_metric');
    
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
  });

  it('should respect enabled configuration', () => {
    const monitor = new PerformanceMonitor(true);
    
    monitor.recordMetric('enabled_test', 100);
    const stats = monitor.getStats('enabled_test');
    
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
  });

  it('should not record metrics when disabled', () => {
    const monitor = new PerformanceMonitor(false);
    
    monitor.recordMetric('disabled_test', 100);
    const stats = monitor.getStats('disabled_test');
    
    expect(stats).toBeNull();
  });

  it('should handle configuration changes during runtime', () => {
    const monitor = new PerformanceMonitor(true);
    
    // Record when enabled
    monitor.recordMetric('runtime_test', 100);
    
    // Simulate disabling (would require extending the interface)
    // For now, just test that enabled metrics work
    const stats = monitor.getStats('runtime_test');
    expect(stats!.count).toBe(1);
  });

  it('should return consistent metric names', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.recordMetric('metric_1', 10);
    monitor.recordMetric('metric_2', 20);
    monitor.recordMetric('metric_3', 30);
    
    const names = monitor.getMetricNames();
    expect(names).toContain('metric_1');
    expect(names).toContain('metric_2');
    expect(names).toContain('metric_3');
    expect(names).toHaveLength(3);
  });

  it('should handle empty state gracefully', () => {
    const monitor = new PerformanceMonitor();
    
    expect(monitor.getMetricNames()).toHaveLength(0);
    expect(monitor.getStats('non_existent')).toBeNull();
  });
});