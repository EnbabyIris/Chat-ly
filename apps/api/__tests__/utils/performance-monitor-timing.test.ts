import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Timing', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should time async function execution', async () => {
    const testFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'result';
    };

    const result = await monitor.timeFunction('async_test', testFunction);
    expect(result).toBe('result');

    const stats = monitor.getStats('async_test');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
    expect(stats!.average).toBeGreaterThanOrEqual(90);
  });

  it('should handle function errors and track timing', async () => {
    const errorFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      throw new Error('Test error');
    };

    await expect(monitor.timeFunction('error_test', errorFunction))
      .rejects.toThrow('Test error');

    const errorStats = monitor.getStats('error_test_error');
    expect(errorStats).not.toBeNull();
    expect(errorStats!.count).toBe(1);
  });

  it('should track multiple function executions', async () => {
    const fastFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'fast';
    };

    await monitor.timeFunction('multi_test', fastFunction);
    await monitor.timeFunction('multi_test', fastFunction);
    await monitor.timeFunction('multi_test', fastFunction);

    const stats = monitor.getStats('multi_test');
    expect(stats!.count).toBe(3);
  });

  it('should handle synchronous functions in timeFunction', async () => {
    const syncFunction = async () => {
      return 'immediate';
    };

    const result = await monitor.timeFunction('sync_test', syncFunction);
    expect(result).toBe('immediate');

    const stats = monitor.getStats('sync_test');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
  });
});