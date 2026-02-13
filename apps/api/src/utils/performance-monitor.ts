/**
 * Performance Monitoring Utility
 * Tracks and analyzes application performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceStats {
  average: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  p99: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    _tags?: Record<string, string>,
  ): void {
    if (!this.enabled) return;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(value);
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Express middleware for request performance monitoring
 */
export const performanceMiddleware = (monitor: PerformanceMonitor) => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const route = req.route?.path || "unknown";
      monitor.recordMetric(`request_duration_${req.method}_${route}`, duration);
    });

    next();
  };
};

/**
 * Global performance monitor instance
 */
export const globalMonitor = new PerformanceMonitor();
