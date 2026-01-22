export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export interface ApiMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: number
  userId?: string
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  timestamp: number
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static apiMetrics: ApiMetrics[] = []
  private static systemMetrics: SystemMetrics[] = []
  private static readonly MAX_METRICS = 1000

  /**
   * Records a performance metric
   */
  static recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    }

    this.metrics.push(metric)
    this.cleanupOldMetrics()
  }

  /**
   * Records API performance metrics
   */
  static recordApiMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string
  ): void {
    const metric: ApiMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
      userId,
    }

    this.apiMetrics.push(metric)
    this.cleanupOldApiMetrics()

    // Also record as general metric
    this.recordMetric('api_response_time', responseTime, {
      endpoint,
      method,
      status: statusCode.toString(),
    })
  }

  /**
   * Records system performance metrics
   */
  static recordSystemMetrics(cpuUsage: number, memoryUsage: number, activeConnections: number): void {
    const metric: SystemMetrics = {
      cpuUsage,
      memoryUsage,
      activeConnections,
      timestamp: Date.now(),
    }

    this.systemMetrics.push(metric)
    this.cleanupOldSystemMetrics()

    // Record individual metrics
    this.recordMetric('cpu_usage', cpuUsage)
    this.recordMetric('memory_usage', memoryUsage)
    this.recordMetric('active_connections', activeConnections)
  }

  /**
   * Gets performance metrics for a specific time range
   */
  static getMetrics(startTime?: number, endTime?: number): PerformanceMetric[] {
    const start = startTime || Date.now() - 3600000 // Default: last hour
    const end = endTime || Date.now()

    return this.metrics.filter(metric => 
      metric.timestamp >= start && metric.timestamp <= end
    )
  }

  /**
   * Gets API metrics with filtering options
   */
  static getApiMetrics(options?: {
    endpoint?: string
    method?: string
    startTime?: number
    endTime?: number
  }): ApiMetrics[] {
    let filtered = this.apiMetrics

    if (options?.endpoint) {
      filtered = filtered.filter(metric => metric.endpoint === options.endpoint)
    }

    if (options?.method) {
      filtered = filtered.filter(metric => metric.method === options.method)
    }

    if (options?.startTime || options?.endTime) {
      const start = options.startTime || 0
      const end = options.endTime || Date.now()
      filtered = filtered.filter(metric => 
        metric.timestamp >= start && metric.timestamp <= end
      )
    }

    return filtered
  }

  /**
   * Calculates average response time for an endpoint
   */
  static getAverageResponseTime(endpoint?: string, timeWindow?: number): number {
    const window = timeWindow || 3600000 // Default: 1 hour
    const cutoff = Date.now() - window

    let relevantMetrics = this.apiMetrics.filter(metric => metric.timestamp >= cutoff)

    if (endpoint) {
      relevantMetrics = relevantMetrics.filter(metric => metric.endpoint === endpoint)
    }

    if (relevantMetrics.length === 0) return 0

    const totalTime = relevantMetrics.reduce((sum, metric) => sum + metric.responseTime, 0)
    return totalTime / relevantMetrics.length
  }

  /**
   * Gets error rate for API endpoints
   */
  static getErrorRate(endpoint?: string, timeWindow?: number): number {
    const window = timeWindow || 3600000 // Default: 1 hour
    const cutoff = Date.now() - window

    let relevantMetrics = this.apiMetrics.filter(metric => metric.timestamp >= cutoff)

    if (endpoint) {
      relevantMetrics = relevantMetrics.filter(metric => metric.endpoint === endpoint)
    }

    if (relevantMetrics.length === 0) return 0

    const errorCount = relevantMetrics.filter(metric => metric.statusCode >= 400).length
    return (errorCount / relevantMetrics.length) * 100
  }

  /**
   * Gets system health summary
   */
  static getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical'
    metrics: {
      avgCpuUsage: number
      avgMemoryUsage: number
      avgConnections: number
      avgResponseTime: number
      errorRate: number
    }
  } {
    const recentMetrics = this.systemMetrics.filter(
      metric => metric.timestamp >= Date.now() - 300000 // Last 5 minutes
    )

    if (recentMetrics.length === 0) {
      return {
        status: 'warning',
        metrics: {
          avgCpuUsage: 0,
          avgMemoryUsage: 0,
          avgConnections: 0,
          avgResponseTime: 0,
          errorRate: 0,
        },
      }
    }

    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length
    const avgConnections = recentMetrics.reduce((sum, m) => sum + m.activeConnections, 0) / recentMetrics.length
    const avgResponseTime = this.getAverageResponseTime(undefined, 300000)
    const errorRate = this.getErrorRate(undefined, 300000)

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Determine system status based on thresholds
    if (avgCpuUsage > 80 || avgMemoryUsage > 85 || avgResponseTime > 1000 || errorRate > 10) {
      status = 'critical'
    } else if (avgCpuUsage > 60 || avgMemoryUsage > 70 || avgResponseTime > 500 || errorRate > 5) {
      status = 'warning'
    }

    return {
      status,
      metrics: {
        avgCpuUsage,
        avgMemoryUsage,
        avgConnections,
        avgResponseTime,
        errorRate,
      },
    }
  }

  /**
   * Gets performance alerts
   */
  static getPerformanceAlerts(): Array<{
    type: 'warning' | 'critical'
    message: string
    timestamp: number
  }> {
    const alerts: Array<{
      type: 'warning' | 'critical'
      message: string
      timestamp: number
    }> = []

    const health = this.getSystemHealth()
    const timestamp = Date.now()

    // CPU alerts
    if (health.metrics.avgCpuUsage > 80) {
      alerts.push({
        type: 'critical',
        message: `High CPU usage: ${health.metrics.avgCpuUsage.toFixed(1)}%`,
        timestamp,
      })
    } else if (health.metrics.avgCpuUsage > 60) {
      alerts.push({
        type: 'warning',
        message: `Elevated CPU usage: ${health.metrics.avgCpuUsage.toFixed(1)}%`,
        timestamp,
      })
    }

    // Memory alerts
    if (health.metrics.avgMemoryUsage > 85) {
      alerts.push({
        type: 'critical',
        message: `High memory usage: ${health.metrics.avgMemoryUsage.toFixed(1)}%`,
        timestamp,
      })
    } else if (health.metrics.avgMemoryUsage > 70) {
      alerts.push({
        type: 'warning',
        message: `Elevated memory usage: ${health.metrics.avgMemoryUsage.toFixed(1)}%`,
        timestamp,
      })
    }

    // Response time alerts
    if (health.metrics.avgResponseTime > 1000) {
      alerts.push({
        type: 'critical',
        message: `Slow response times: ${health.metrics.avgResponseTime.toFixed(0)}ms`,
        timestamp,
      })
    } else if (health.metrics.avgResponseTime > 500) {
      alerts.push({
        type: 'warning',
        message: `Elevated response times: ${health.metrics.avgResponseTime.toFixed(0)}ms`,
        timestamp,
      })
    }

    // Error rate alerts
    if (health.metrics.errorRate > 10) {
      alerts.push({
        type: 'critical',
        message: `High error rate: ${health.metrics.errorRate.toFixed(1)}%`,
        timestamp,
      })
    } else if (health.metrics.errorRate > 5) {
      alerts.push({
        type: 'warning',
        message: `Elevated error rate: ${health.metrics.errorRate.toFixed(1)}%`,
        timestamp,
      })
    }

    return alerts
  }

  /**
   * Cleans up old metrics to prevent memory leaks
   */
  private static cleanupOldMetrics(): void {
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  private static cleanupOldApiMetrics(): void {
    if (this.apiMetrics.length > this.MAX_METRICS) {
      this.apiMetrics = this.apiMetrics.slice(-this.MAX_METRICS)
    }
  }

  private static cleanupOldSystemMetrics(): void {
    if (this.systemMetrics.length > this.MAX_METRICS) {
      this.systemMetrics = this.systemMetrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Resets all metrics (useful for testing)
   */
  static reset(): void {
    this.metrics = []
    this.apiMetrics = []
    this.systemMetrics = []
  }
}