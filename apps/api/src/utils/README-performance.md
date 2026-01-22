# Performance Monitoring Utilities

This directory contains utilities for performance monitoring and metrics collection in the Chat-Turbo application.

## Files

### `performance-monitor.ts`
Main performance monitoring service that collects and aggregates metrics:
- HTTP request/response metrics
- Database query performance
- Cache hit/miss ratios
- System resource usage
- Custom application metrics

### `metrics-collector.ts`
Low-level metrics collection utilities:
- Timer functions for measuring execution time
- Counter and gauge implementations
- Histogram aggregations
- Metric serialization

### `alert-manager.ts`
Alert management system:
- Rule-based alerting
- Alert throttling and deduplication
- Notification dispatching
- Alert lifecycle management

## Usage

### Basic Performance Monitoring

```typescript
import { PerformanceMonitor } from './performance-monitor';

const monitor = new PerformanceMonitor();

// Track API endpoint performance
app.use('/api/*', (req, res, next) => {
  const startTime = monitor.startTimer('api_request');

  res.on('finish', () => {
    monitor.recordTimer('api_request', startTime, {
      method: req.method,
      endpoint: req.path,
      status: res.statusCode,
    });
  });

  next();
});
```

### Database Performance Monitoring

```typescript
import { monitorDatabaseQuery } from './performance-monitor';

// Wrap database queries
const result = await monitorDatabaseQuery(
  'SELECT * FROM users WHERE id = ?',
  [userId],
  { table: 'users', operation: 'select' }
);
```

### Custom Metrics

```typescript
import { PerformanceMonitor } from './performance-monitor';

const monitor = PerformanceMonitor.getInstance();

// Increment counters
monitor.incrementCounter('messages_sent', { channel: 'public' });

// Record gauges
monitor.recordGauge('active_connections', connectionCount);

// Record histograms
monitor.recordHistogram('message_size', message.length);
```

## Metrics Types

### Counters
Monotonically increasing values:
- `messages_sent_total`
- `api_requests_total`
- `errors_total`

### Gauges
Values that can increase or decrease:
- `active_connections`
- `memory_usage_mb`
- `cpu_usage_percent`

### Histograms
Distributions of values:
- `http_request_duration_seconds`
- `database_query_duration_seconds`
- `message_processing_time_seconds`

### Timers
Duration measurements:
- Automatically creates histogram metrics
- Supports custom tags and labels

## Alerting

### Defining Alert Rules

```typescript
import { AlertManager } from './alert-manager';

const alertManager = new AlertManager();

alertManager.addRule({
  id: 'high-response-time',
  name: 'High API Response Time',
  metric: 'http_request_duration_seconds',
  condition: 'gt',
  threshold: 2.0, // 2 seconds
  duration: 300, // 5 minutes
  severity: 'high',
  enabled: true,
});
```

### Alert Notifications

Alerts can be sent to:
- Slack channels
- Email addresses
- Webhooks
- Logging systems
- Custom handlers

## Configuration

### Environment Variables

```bash
# Monitoring settings
PERFORMANCE_MONITORING_ENABLED=true
METRICS_SAMPLING_RATE=1.0
METRICS_RETENTION_DAYS=30

# Alert settings
ALERT_EMAIL_ENABLED=true
ALERT_SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Exporter settings
METRICS_PROMETHEUS_PORT=9090
METRICS_FILE_PATH=/var/log/metrics.json
```

### Runtime Configuration

```typescript
import { getMonitoringConfig } from '../config/monitoring';

const config = getMonitoringConfig(process.env.NODE_ENV);
PerformanceMonitor.configure(config);
```

## Performance Considerations

### Memory Usage
- Metrics are stored in memory with configurable retention
- Automatic cleanup of old metrics
- Configurable sampling rates to reduce memory footprint

### CPU Overhead
- Minimal overhead for metric collection
- Asynchronous metric processing
- Configurable sampling to reduce CPU usage

### Storage
- Metrics can be exported to external systems
- File-based storage with rotation
- Database storage for historical analysis

## Testing

Run performance monitoring tests:
```bash
npm test -- performance-monitor.test.ts
npm test -- alert-manager.test.ts
```

## Integration

### With Prometheus

```typescript
import { PrometheusExporter } from './exporters/prometheus';

const exporter = new PrometheusExporter();
monitor.addExporter(exporter);
```

### With DataDog

```typescript
import { DataDogExporter } from './exporters/datadog';

const exporter = new DataDogExporter({
  apiKey: process.env.DD_API_KEY,
  appKey: process.env.DD_APP_KEY,
});
monitor.addExporter(exporter);
```

## Troubleshooting

### High Memory Usage
- Reduce sampling rate
- Decrease retention period
- Use external metric storage

### Missing Metrics
- Check if monitoring is enabled
- Verify metric names and tags
- Check exporter configuration

### Alert Spam
- Adjust alert thresholds
- Increase throttle windows
- Review alert rules for duplicates