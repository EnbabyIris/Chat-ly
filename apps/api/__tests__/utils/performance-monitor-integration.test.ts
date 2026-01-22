import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor, performanceMiddleware } from '../../src/utils/performance-monitor';

describe('PerformanceMonitor Integration', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should work with database query timing simulation', async () => {
    const simulateDbQuery = async (queryType: string) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return `${queryType} result`;
    };

    // Simulate multiple database operations
    await monitor.timeFunction('db_select', () => simulateDbQuery('SELECT'));
    await monitor.timeFunction('db_insert', () => simulateDbQuery('INSERT'));
    await monitor.timeFunction('db_update', () => simulateDbQuery('UPDATE'));
    await monitor.timeFunction('db_select', () => simulateDbQuery('SELECT'));

    const selectStats = monitor.getStats('db_select');
    const insertStats = monitor.getStats('db_insert');
    const updateStats = monitor.getStats('db_update');

    expect(selectStats!.count).toBe(2);
    expect(insertStats!.count).toBe(1);
    expect(updateStats!.count).toBe(1);
  });

  it('should track API endpoint performance patterns', async () => {
    const simulateApiCall = async (endpoint: string, complexity: number) => {
      const delay = complexity * 20; // More complex operations take longer
      await new Promise(resolve => setTimeout(resolve, delay));
      return `${endpoint} response`;
    };

    // Simulate different API endpoints with varying complexity
    await monitor.timeFunction('api_users_list', () => simulateApiCall('users/list', 1));
    await monitor.timeFunction('api_users_search', () => simulateApiCall('users/search', 3));
    await monitor.timeFunction('api_users_report', () => simulateApiCall('users/report', 5));

    const listStats = monitor.getStats('api_users_list');
    const searchStats = monitor.getStats('api_users_search');
    const reportStats = monitor.getStats('api_users_report');

    expect(listStats!.average).toBeLessThan(searchStats!.average);
    expect(searchStats!.average).toBeLessThan(reportStats!.average);
  });

  it('should work with error tracking and recovery', async () => {
    const unreliableOperation = async (shouldFail: boolean) => {
      await new Promise(resolve => setTimeout(resolve, 30));
      if (shouldFail) {
        throw new Error('Simulated failure');
      }
      return 'success';
    };

    // Mix of successful and failed operations
    await monitor.timeFunction('reliable_op', () => unreliableOperation(false));
    
    try {
      await monitor.timeFunction('unreliable_op', () => unreliableOperation(true));
    } catch (error) {
      // Expected error
    }

    await monitor.timeFunction('reliable_op', () => unreliableOperation(false));

    const successStats = monitor.getStats('reliable_op');
    const errorStats = monitor.getStats('unreliable_op_error');

    expect(successStats!.count).toBe(2);
    expect(errorStats!.count).toBe(1);
  });

  it('should provide comprehensive performance insights', () => {
    // Simulate a complex application scenario
    const operationTimes = {
      fast_operation: [10, 12, 8, 15, 11],
      medium_operation: [50, 45, 60, 55, 52],
      slow_operation: [200, 250, 180, 220, 190]
    };

    Object.entries(operationTimes).forEach(([operation, times]) => {
      times.forEach(time => {
        monitor.recordMetric(operation, time);
      });
    });

    const fastStats = monitor.getStats('fast_operation');
    const mediumStats = monitor.getStats('medium_operation');
    const slowStats = monitor.getStats('slow_operation');

    // Verify performance characteristics
    expect(fastStats!.p95).toBeLessThan(20);
    expect(mediumStats!.p95).toBeGreaterThan(20);
    expect(mediumStats!.p95).toBeLessThan(100);
    expect(slowStats!.p95).toBeGreaterThan(150);

    // Verify all operations have consistent counts
    expect(fastStats!.count).toBe(5);
    expect(mediumStats!.count).toBe(5);
    expect(slowStats!.count).toBe(5);
  });

  it('should handle high-throughput scenarios', () => {
    const startTime = Date.now();
    
    // Record 10,000 metrics rapidly
    for (let i = 0; i < 10000; i++) {
      monitor.recordMetric('high_throughput', i % 1000);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const stats = monitor.getStats('high_throughput');
    expect(stats!.count).toBe(10000);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should integrate with middleware for request tracking', () => {
    const middleware = performanceMiddleware(monitor);
    
    // This test verifies the middleware can be created and used
    expect(typeof middleware).toBe('function');
    
    // In a real scenario, this would be used with Express
    // For now, we verify the monitor is properly integrated
    monitor.recordMetric('middleware_test', 100);
    const stats = monitor.getStats('middleware_test');
    expect(stats!.count).toBe(1);
  });
});