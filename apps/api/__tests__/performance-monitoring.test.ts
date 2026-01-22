import { PerformanceMonitor } from '../src/utils/performance-monitor'

describe('PerformanceMonitor - Comprehensive Testing', () => {
  beforeEach(() => {
    // Reset metrics before each test
    PerformanceMonitor.reset()
  })

  // F2P Tests: Performance monitoring was not implemented before
  describe('F2P: Performance Monitoring Implementation', () => {
    it('should track API response times that were not monitored before', () => {
      // F2P: API response times were not being tracked before implementation
      const testCases = [
        { endpoint: '/api/auth/login', method: 'POST', responseTime: 150, statusCode: 200 },
        { endpoint: '/api/messages', method: 'GET', responseTime: 75, statusCode: 200 },
        { endpoint: '/api/users/profile', method: 'PUT', responseTime: 200, statusCode: 200 },
      ]

      // Before: No tracking of response times
      // After: All API calls are monitored and tracked
      testCases.forEach(testCase => {
        PerformanceMonitor.recordApiMetric(
          testCase.endpoint,
          testCase.method,
          testCase.responseTime,
          testCase.statusCode,
          'user123'
        )
      })

      const metrics = PerformanceMonitor.getApiMetrics()
      expect(metrics).toHaveLength(3)
      
      const loginMetric = metrics.find(m => m.endpoint === '/api/auth/login')
      expect(loginMetric).toBeDefined()
      expect(loginMetric?.responseTime).toBe(150)
      expect(loginMetric?.method).toBe('POST')
    })

    it('should detect performance issues that went unnoticed before', () => {
      // F2P: Performance degradation was not detected before monitoring
      const slowEndpoints = [
        { endpoint: '/api/slow-query', method: 'GET', responseTime: 1200, statusCode: 200 },
        { endpoint: '/api/timeout', method: 'POST', responseTime: 1500, statusCode: 500 },
        { endpoint: '/api/heavy-load', method: 'GET', responseTime: 800, statusCode: 200 },
      ]

      slowEndpoints.forEach(endpoint => {
        PerformanceMonitor.recordApiMetric(
          endpoint.endpoint,
          endpoint.method,
          endpoint.responseTime,
          endpoint.statusCode
        )
      })

      // Before: Slow endpoints would go undetected
      // After: Performance monitoring identifies slow responses
      const avgResponseTime = PerformanceMonitor.getAverageResponseTime()
      expect(avgResponseTime).toBeGreaterThan(1000) // Should detect slow performance

      const alerts = PerformanceMonitor.getPerformanceAlerts()
      const responseTimeAlert = alerts.find(alert => alert.message.includes('response times'))
      expect(responseTimeAlert).toBeDefined()
      expect(responseTimeAlert?.type).toBe('critical')
    })

    it('should monitor system resources that were invisible before', () => {
      // F2P: System resource usage was not monitored before
      const systemStates = [
        { cpu: 85, memory: 90, connections: 150 }, // Critical state
        { cpu: 65, memory: 75, connections: 100 }, // Warning state
        { cpu: 30, memory: 45, connections: 50 },  // Healthy state
      ]

      systemStates.forEach(state => {
        PerformanceMonitor.recordSystemMetrics(state.cpu, state.memory, state.connections)
      })

      // Before: No visibility into system resource usage
      // After: Complete system health monitoring
      const health = PerformanceMonitor.getSystemHealth()
      expect(health.status).toBe('critical') // Should detect high resource usage
      expect(health.metrics.avgCpuUsage).toBeGreaterThan(60)
      expect(health.metrics.avgMemoryUsage).toBeGreaterThan(70)
    })
  })

  // P2P Tests: Ensure existing functionality remains intact
  describe('P2P: Regression Protection Tests', () => {
    it('should maintain PerformanceMonitor API without breaking changes', () => {
      // P2P: Ensure all expected methods exist and work
      expect(typeof PerformanceMonitor.recordMetric).toBe('function')
      expect(typeof PerformanceMonitor.recordApiMetric).toBe('function')
      expect(typeof PerformanceMonitor.recordSystemMetrics).toBe('function')
      expect(typeof PerformanceMonitor.getMetrics).toBe('function')
      expect(typeof PerformanceMonitor.getApiMetrics).toBe('function')
      expect(typeof PerformanceMonitor.getSystemHealth).toBe('function')

      // Test that methods can be called without errors
      PerformanceMonitor.recordMetric('test_metric', 100)
      PerformanceMonitor.recordApiMetric('/test', 'GET', 50, 200)
      PerformanceMonitor.recordSystemMetrics(50, 60, 25)

      expect(PerformanceMonitor.getMetrics()).toHaveLength(4) // 1 custom + 3 system metrics
    })

    it('should preserve existing metric data structure', () => {
      // P2P: Ensure metric data structure hasn't changed
      PerformanceMonitor.recordMetric('test_metric', 42, { tag1: 'value1' })
      
      const metrics = PerformanceMonitor.getMetrics()
      const testMetric = metrics.find(m => m.name === 'test_metric')
      
      expect(testMetric).toHaveProperty('name')
      expect(testMetric).toHaveProperty('value')
      expect(testMetric).toHaveProperty('timestamp')
      expect(testMetric).toHaveProperty('tags')
      
      expect(testMetric?.name).toBe('test_metric')
      expect(testMetric?.value).toBe(42)
      expect(testMetric?.tags).toEqual({ tag1: 'value1' })
    })

    it('should maintain backward compatibility with filtering', () => {
      // P2P: Ensure filtering functionality still works
      const now = Date.now()
      
      PerformanceMonitor.recordApiMetric('/api/test1', 'GET', 100, 200)
      PerformanceMonitor.recordApiMetric('/api/test2', 'POST', 150, 201)
      PerformanceMonitor.recordApiMetric('/api/test1', 'PUT', 120, 200)

      // Test endpoint filtering
      const test1Metrics = PerformanceMonitor.getApiMetrics({ endpoint: '/api/test1' })
      expect(test1Metrics).toHaveLength(2)
      expect(test1Metrics.every(m => m.endpoint === '/api/test1')).toBe(true)

      // Test method filtering
      const getMetrics = PerformanceMonitor.getApiMetrics({ method: 'GET' })
      expect(getMetrics).toHaveLength(1)
      expect(getMetrics[0].method).toBe('GET')
    })
  })

  // Comprehensive functionality tests
  describe('Performance Analytics', () => {
    it('should calculate accurate average response times', () => {
      const responseTimes = [100, 150, 200, 120, 180]
      const expectedAverage = responseTimes.reduce((a, b) => a + b) / responseTimes.length

      responseTimes.forEach((time, index) => {
        PerformanceMonitor.recordApiMetric(`/api/test${index}`, 'GET', time, 200)
      })

      const actualAverage = PerformanceMonitor.getAverageResponseTime()
      expect(actualAverage).toBeCloseTo(expectedAverage, 1)
    })

    it('should calculate error rates correctly', () => {
      // Record mix of successful and failed requests
      const requests = [
        { status: 200 }, { status: 200 }, { status: 404 },
        { status: 200 }, { status: 500 }, { status: 200 },
        { status: 403 }, { status: 200 }, { status: 200 }, { status: 200 }
      ]

      requests.forEach((req, index) => {
        PerformanceMonitor.recordApiMetric(`/api/test${index}`, 'GET', 100, req.status)
      })

      const errorRate = PerformanceMonitor.getErrorRate()
      expect(errorRate).toBe(30) // 3 errors out of 10 requests = 30%
    })

    it('should generate appropriate alerts based on thresholds', () => {
      // Simulate critical system state
      PerformanceMonitor.recordSystemMetrics(85, 90, 200) // High CPU and memory
      PerformanceMonitor.recordApiMetric('/api/slow', 'GET', 1200, 500) // Slow response with error

      const alerts = PerformanceMonitor.getPerformanceAlerts()
      
      expect(alerts.length).toBeGreaterThan(0)
      
      const criticalAlerts = alerts.filter(alert => alert.type === 'critical')
      expect(criticalAlerts.length).toBeGreaterThan(0)
      
      // Should have alerts for CPU, memory, and response time
      const alertMessages = alerts.map(alert => alert.message)
      expect(alertMessages.some(msg => msg.includes('CPU usage'))).toBe(true)
      expect(alertMessages.some(msg => msg.includes('memory usage'))).toBe(true)
    })
  })

  // Memory management and cleanup tests
  describe('Memory Management', () => {
    it('should limit metrics storage to prevent memory leaks', () => {
      // Record more than MAX_METRICS (1000) to test cleanup
      for (let i = 0; i < 1200; i++) {
        PerformanceMonitor.recordMetric(`metric_${i}`, i)
      }

      const metrics = PerformanceMonitor.getMetrics()
      expect(metrics.length).toBeLessThanOrEqual(1000)
    })

    it('should clean up old API metrics appropriately', () => {
      // Record many API metrics
      for (let i = 0; i < 1200; i++) {
        PerformanceMonitor.recordApiMetric(`/api/test${i}`, 'GET', 100, 200)
      }

      const apiMetrics = PerformanceMonitor.getApiMetrics()
      expect(apiMetrics.length).toBeLessThanOrEqual(1000)
    })
  })

  // Performance tests for the monitor itself
  describe('Monitor Performance', () => {
    it('should record metrics quickly without impacting performance', () => {
      const startTime = performance.now()
      
      // Record 100 metrics
      for (let i = 0; i < 100; i++) {
        PerformanceMonitor.recordMetric(`perf_test_${i}`, i)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in under 50ms
      expect(duration).toBeLessThan(50)
    })

    it('should retrieve metrics efficiently', () => {
      // Record some test data
      for (let i = 0; i < 500; i++) {
        PerformanceMonitor.recordApiMetric(`/api/test${i}`, 'GET', 100, 200)
      }

      const startTime = performance.now()
      
      // Perform various queries
      PerformanceMonitor.getApiMetrics({ endpoint: '/api/test1' })
      PerformanceMonitor.getAverageResponseTime()
      PerformanceMonitor.getErrorRate()
      PerformanceMonitor.getSystemHealth()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete all queries in under 20ms
      expect(duration).toBeLessThan(20)
    })
  })

  // Edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle empty metrics gracefully', () => {
      expect(PerformanceMonitor.getAverageResponseTime()).toBe(0)
      expect(PerformanceMonitor.getErrorRate()).toBe(0)
      
      const health = PerformanceMonitor.getSystemHealth()
      expect(health.status).toBe('warning')
      expect(health.metrics.avgCpuUsage).toBe(0)
    })

    it('should handle invalid input values', () => {
      expect(() => {
        PerformanceMonitor.recordMetric('', -1)
        PerformanceMonitor.recordApiMetric('', '', -1, 0)
        PerformanceMonitor.recordSystemMetrics(-1, -1, -1)
      }).not.toThrow()
    })

    it('should handle time range queries correctly', () => {
      const now = Date.now()
      const oneHourAgo = now - 3600000

      // Record metrics at different times (simulated)
      PerformanceMonitor.recordMetric('old_metric', 100)
      PerformanceMonitor.recordMetric('new_metric', 200)

      const recentMetrics = PerformanceMonitor.getMetrics(oneHourAgo, now)
      expect(recentMetrics.length).toBeGreaterThan(0)
    })
  })
})