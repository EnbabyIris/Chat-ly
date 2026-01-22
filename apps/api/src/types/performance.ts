/**
 * Performance monitoring types and interfaces
 */

export interface PerformanceMetrics {
  timestamp: Date;
  category: 'api' | 'database' | 'cache' | 'external' | 'system';
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'mb' | 'cpu_percent';
  tags: Record<string, string>;
}

export interface ResponseTimeMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ip?: string;
}

export interface DatabaseMetrics {
  query: string;
  executionTime: number;
  connectionCount: number;
  poolSize: number;
  activeConnections: number;
  idleConnections: number;
}

export interface CacheMetrics {
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  memoryUsage: number;
  keyCount: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: number[];
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  value: number;
  threshold: number;
  metadata: Record<string, any>;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    requestCount: number;
    averageResponseTime: number;
    errorCount: number;
    slowestResponse: number;
  }>;
  alerts: Alert[];
  recommendations: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  samplingRate: number; // 0.0 to 1.0
  retentionPeriod: number; // days
  alertRules: AlertRule[];
  exporters: {
    console?: boolean;
    file?: {
      path: string;
      format: 'json' | 'csv';
    };
    prometheus?: {
      endpoint: string;
      port: number;
    };
    datadog?: {
      apiKey: string;
      appKey: string;
    };
  };
}

export type MetricAggregator = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'percentile';

export interface MetricQuery {
  metric: string;
  aggregator: MetricAggregator;
  timeRange: {
    start: Date;
    end: Date;
  };
  groupBy?: string[];
  filter?: Record<string, any>;
  percentile?: number; // for percentile aggregator
}