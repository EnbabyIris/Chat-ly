import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PerformanceMonitor, performanceMiddleware } from '../../src/utils/performance-monitor';

describe('Performance Middleware', () => {
  let monitor: PerformanceMonitor;
  let middleware: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    middleware = performanceMiddleware(monitor);
    
    mockReq = {
      method: 'GET',
      route: { path: '/api/test' }
    };
    
    mockRes = {
      on: jest.fn()
    };
    
    mockNext = jest.fn();
  });

  it('should set up response listener', () => {
    middleware(mockReq, mockRes, mockNext);
    
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should record request duration on response finish', () => {
    middleware(mockReq, mockRes, mockNext);
    
    // Get the finish callback
    const finishCallback = (mockRes.on as jest.Mock).mock.calls[0][1];
    
    // Simulate response finish
    finishCallback();
    
    const metricNames = monitor.getMetricNames();
    expect(metricNames).toContain('request_duration_GET_/api/test');
  });

  it('should handle requests without route path', () => {
    mockReq.route = undefined;
    middleware(mockReq, mockRes, mockNext);
    
    const finishCallback = (mockRes.on as jest.Mock).mock.calls[0][1];
    finishCallback();
    
    const metricNames = monitor.getMetricNames();
    expect(metricNames).toContain('request_duration_GET_unknown');
  });

  it('should track different HTTP methods separately', () => {
    const getReq = { ...mockReq, method: 'GET' };
    const postReq = { ...mockReq, method: 'POST' };
    
    // Process GET request
    middleware(getReq, mockRes, mockNext);
    let finishCallback = (mockRes.on as jest.Mock).mock.calls[0][1];
    finishCallback();
    
    // Reset mock
    (mockRes.on as jest.Mock).mockClear();
    
    // Process POST request
    middleware(postReq, mockRes, mockNext);
    finishCallback = (mockRes.on as jest.Mock).mock.calls[0][1];
    finishCallback();
    
    const metricNames = monitor.getMetricNames();
    expect(metricNames).toContain('request_duration_GET_/api/test');
    expect(metricNames).toContain('request_duration_POST_/api/test');
  });
});