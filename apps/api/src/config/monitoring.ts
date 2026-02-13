/**
 * Performance monitoring configuration
 */

import type { MonitoringConfig, AlertRule } from "../types/performance";

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "high-response-time",
    name: "High Response Time",
    metric: "http_request_duration_ms",
    condition: "gt",
    threshold: 1000, // 1 second
    duration: 300, // 5 minutes
    severity: "medium",
    enabled: true,
  },
  {
    id: "high-error-rate",
    name: "High Error Rate",
    metric: "http_requests_total",
    condition: "gt",
    threshold: 0.05, // 5%
    duration: 300, // 5 minutes
    severity: "high",
    enabled: true,
  },
  {
    id: "high-memory-usage",
    name: "High Memory Usage",
    metric: "process_memory_usage_mb",
    condition: "gt",
    threshold: 500, // 500MB
    duration: 60, // 1 minute
    severity: "medium",
    enabled: true,
  },
  {
    id: "high-cpu-usage",
    name: "High CPU Usage",
    metric: "process_cpu_usage_percent",
    condition: "gt",
    threshold: 80, // 80%
    duration: 300, // 5 minutes
    severity: "high",
    enabled: true,
  },
  {
    id: "database-connection-pool-exhausted",
    name: "Database Connection Pool Exhausted",
    metric: "db_connection_pool_active_count",
    condition: "gte",
    threshold: 20, // 20 active connections
    duration: 60, // 1 minute
    severity: "critical",
    enabled: true,
  },
];

export const PRODUCTION_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  samplingRate: 1.0, // Sample all requests in production
  retentionPeriod: 30, // Keep metrics for 30 days
  alertRules: DEFAULT_ALERT_RULES,
  exporters: {
    console: false,
    file: {
      path: "/var/log/chat-turbo/metrics.json",
      format: "json",
    },
    prometheus: {
      endpoint: "/metrics",
      port: 9090,
    },
  },
};

export const DEVELOPMENT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  samplingRate: 0.1, // Sample 10% of requests in development
  retentionPeriod: 7, // Keep metrics for 7 days
  alertRules: DEFAULT_ALERT_RULES.map((rule) => ({
    ...rule,
    enabled: false, // Disable alerts in development
  })),
  exporters: {
    console: true,
    file: {
      path: "./logs/metrics.json",
      format: "json",
    },
  },
};

export const TESTING_MONITORING_CONFIG: MonitoringConfig = {
  enabled: false,
  samplingRate: 0.0,
  retentionPeriod: 1,
  alertRules: [],
  exporters: {
    console: true,
  },
};

export function getMonitoringConfig(
  nodeEnv: string = "development",
): MonitoringConfig {
  switch (nodeEnv.toLowerCase()) {
    case "production":
      return PRODUCTION_MONITORING_CONFIG;
    case "development":
      return DEVELOPMENT_MONITORING_CONFIG;
    case "test":
    case "testing":
      return TESTING_MONITORING_CONFIG;
    default:
      return DEVELOPMENT_MONITORING_CONFIG;
  }
}

export const METRIC_BUCKETS = {
  responseTime: [0.1, 0.5, 1, 2, 5, 10], // seconds
  requestSize: [100, 1000, 10000, 100000, 1000000], // bytes
  databaseQueryTime: [0.001, 0.01, 0.1, 1, 10], // seconds
};

export const DASHBOARD_REFRESH_INTERVALS = {
  realtime: 5000, // 5 seconds
  fast: 30000, // 30 seconds
  normal: 60000, // 1 minute
  slow: 300000, // 5 minutes
};

export const ALERT_THROTTLE_WINDOW = 300000; // 5 minutes - don't send duplicate alerts
