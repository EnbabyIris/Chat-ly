import { Request, Response } from 'express'
import { AdvancedRateLimiter, createRateLimiters, rateLimitMiddleware } from '../src/utils/advanced-rate-limiter'

// Mock Express Request and Response
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  ip: '127.0.0.1',
  body: {},
  headers: {},
  ...overrides,
})

const createMockResponse = (): Partial<Response> => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    statusCode: 200,
    on: jest.fn(),
  }
  return res
}

const createMockNext = () => jest.fn()

describe('AdvancedRateLimiter', () => {
  let rateLimiter: AdvancedRateLimiter

  beforeEach(() => {
    rateLimiter = new AdvancedRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    })
  })

  afterEach(() => {
    rateLimiter.destroy()
  })

  describe('basic rate limiting', () => {
    it('should allow requests within limit', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Make 3 requests (within limit of 5)
      for (let i = 0; i < 3; i++) {
        await middleware(req as Request, res as Response, next)
      }

      expect(next).toHaveBeenCalledTimes(3)
      expect(res.status).not.toHaveBeenCalledWith(429)
    })

    it('should block requests exceeding limit', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Make 6 requests (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        await middleware(req as Request, res as Response, next)
      }

      expect(next).toHaveBeenCalledTimes(5)
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: 60,
      })
    })

    it('should reset limit after window expires', async () => {
      const shortLimiter = new AdvancedRateLimiter({
        windowMs: 100, // 100ms
        maxRequests: 2,
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = shortLimiter.middleware()

      // Exhaust limit
      await middleware(req as Request, res as Response, next)
      await middleware(req as Request, res as Response, next)
      await middleware(req as Request, res as Response, next) // Should be blocked

      expect(res.status).toHaveBeenCalledWith(429)

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should allow requests again
      const newNext = createMockNext()
      await middleware(req as Request, res as Response, createMockResponse(), newNext)

      expect(newNext).toHaveBeenCalled()

      shortLimiter.destroy()
    })
  })

  describe('custom key generation', () => {
    it('should use custom key generator', async () => {
      const customLimiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => `user_${req.body?.userId || 'anonymous'}`,
      })

      const req1 = createMockRequest({ body: { userId: 'user1' } })
      const req2 = createMockRequest({ body: { userId: 'user2' } })
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = customLimiter.middleware()

      // Each user should have separate limits
      await middleware(req1 as Request, res as Response, next)
      await middleware(req1 as Request, res as Response, next)
      await middleware(req1 as Request, res as Response, next) // Should block user1

      await middleware(req2 as Request, res as Response, next) // Should allow user2

      expect(next).toHaveBeenCalledTimes(3) // 2 for user1, 1 for user2
      expect(res.status).toHaveBeenCalledWith(429)

      customLimiter.destroy()
    })
  })

  describe('whitelist and blacklist', () => {
    it('should allow whitelisted IPs', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        whitelist: ['192.168.1.1'],
      })

      const req = createMockRequest({ ip: '192.168.1.1' })
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = limiter.middleware()

      // Make multiple requests (should all pass due to whitelist)
      for (let i = 0; i < 5; i++) {
        await middleware(req as Request, res as Response, next)
      }

      expect(next).toHaveBeenCalledTimes(5)
      expect(res.status).not.toHaveBeenCalledWith(429)

      limiter.destroy()
    })

    it('should block blacklisted IPs', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        blacklist: ['10.0.0.1'],
      })

      const req = createMockRequest({ ip: '10.0.0.1' })
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = limiter.middleware()

      await middleware(req as Request, res as Response, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'IP blacklisted',
        retryAfter: 60,
      })

      limiter.destroy()
    })

    it('should manage whitelist dynamically', () => {
      rateLimiter.addToWhitelist('192.168.1.100')
      rateLimiter.addToWhitelist('192.168.1.101')

      expect(rateLimiter['config'].whitelist).toContain('192.168.1.100')
      expect(rateLimiter['config'].whitelist).toContain('192.168.1.101')

      rateLimiter.removeFromWhitelist('192.168.1.100')
      expect(rateLimiter['config'].whitelist).not.toContain('192.168.1.100')
      expect(rateLimiter['config'].whitelist).toContain('192.168.1.101')
    })

    it('should manage blacklist dynamically', () => {
      rateLimiter.addToBlacklist('10.0.0.100')
      rateLimiter.addToBlacklist('10.0.0.101')

      expect(rateLimiter['config'].blacklist).toContain('10.0.0.100')
      expect(rateLimiter['config'].blacklist).toContain('10.0.0.101')

      rateLimiter.removeFromBlacklist('10.0.0.100')
      expect(rateLimiter['config'].blacklist).not.toContain('10.0.0.100')
      expect(rateLimiter['config'].blacklist).toContain('10.0.0.101')
    })
  })

  describe('progressive blocking', () => {
    it('should implement progressive blocking for repeated violations', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 2,
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = limiter.middleware()

      // Make requests to trigger progressive blocking
      for (let i = 0; i < 6; i++) {
        await middleware(req as Request, res as Response, next)
      }

      // Check that user is blocked
      const status = await limiter.getStatus('127.0.0.1')
      expect(status?.isBlocked).toBe(true)

      limiter.destroy()
    })
  })

  describe('rate limit headers', () => {
    it('should set appropriate rate limit headers', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      await middleware(req as Request, res as Response, next)

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': expect.any(String),
        'X-RateLimit-Window': '60000',
      })
    })

    it('should set retry-after header when blocked', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        await middleware(req as Request, res as Response, next)
      }

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Retry-After': expect.any(String),
        })
      )
    })
  })

  describe('skip options', () => {
    it('should skip successful requests when configured', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      // Mock successful response
      res.statusCode = 200

      const middleware = limiter.middleware()

      // Make requests that should be skipped
      await middleware(req as Request, res as Response, next)
      
      // Simulate response finish event
      const finishCallback = (res.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )?.[1]
      
      if (finishCallback) {
        finishCallback()
      }

      const status = await limiter.getStatus('127.0.0.1')
      expect(status?.totalHits).toBe(0) // Should be decremented

      limiter.destroy()
    })

    it('should skip failed requests when configured', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      // Mock failed response
      res.statusCode = 500

      const middleware = limiter.middleware()

      await middleware(req as Request, res as Response, next)
      
      // Simulate response finish event
      const finishCallback = (res.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )?.[1]
      
      if (finishCallback) {
        finishCallback()
      }

      const status = await limiter.getStatus('127.0.0.1')
      expect(status?.totalHits).toBe(0) // Should be decremented

      limiter.destroy()
    })
  })

  describe('statistics and monitoring', () => {
    it('should provide accurate statistics', async () => {
      const req1 = createMockRequest({ ip: '192.168.1.1' })
      const req2 = createMockRequest({ ip: '192.168.1.2' })
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Make requests from different IPs
      await middleware(req1 as Request, res as Response, next)
      await middleware(req1 as Request, res as Response, next)
      await middleware(req2 as Request, res as Response, next)

      const stats = rateLimiter.getStatistics()

      expect(stats.totalActiveKeys).toBe(2)
      expect(stats.averageRequestsPerKey).toBe(1.5) // (2 + 1) / 2
      expect(stats.topRequesters).toHaveLength(2)
      expect(stats.topRequesters[0].requests).toBe(2)
    })

    it('should track blocked keys in statistics', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Exhaust limit to trigger blocking
      for (let i = 0; i < 6; i++) {
        await middleware(req as Request, res as Response, next)
      }

      const stats = rateLimiter.getStatistics()
      expect(stats.totalBlockedKeys).toBe(0) // Progressive blocking happens after 2x limit
    })
  })

  describe('state persistence', () => {
    it('should export and import state correctly', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Make some requests
      await middleware(req as Request, res as Response, next)
      await middleware(req as Request, res as Response, next)

      // Export state
      const state = rateLimiter.exportState()
      expect(Object.keys(state)).toHaveLength(1)
      expect(state['127.0.0.1'].count).toBe(2)

      // Create new limiter and import state
      const newLimiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      newLimiter.importState(state)

      const status = await newLimiter.getStatus('127.0.0.1')
      expect(status?.totalHits).toBe(2)

      newLimiter.destroy()
    })
  })

  describe('reset functionality', () => {
    it('should reset rate limit for specific key', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = rateLimiter.middleware()

      // Make requests
      await middleware(req as Request, res as Response, next)
      await middleware(req as Request, res as Response, next)

      let status = await rateLimiter.getStatus('127.0.0.1')
      expect(status?.totalHits).toBe(2)

      // Reset
      const resetResult = rateLimiter.reset('127.0.0.1')
      expect(resetResult).toBe(true)

      status = await rateLimiter.getStatus('127.0.0.1')
      expect(status).toBeNull()
    })

    it('should return false when resetting non-existent key', () => {
      const resetResult = rateLimiter.reset('non-existent-key')
      expect(resetResult).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should fail open when rate limiter encounters errors', async () => {
      const limiter = new AdvancedRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: () => {
          throw new Error('Key generation failed')
        },
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = limiter.middleware()

      await middleware(req as Request, res as Response, next)

      // Should still call next despite error
      expect(next).toHaveBeenCalled()

      limiter.destroy()
    })
  })

  describe('cleanup functionality', () => {
    it('should clean up expired entries', async () => {
      const shortLimiter = new AdvancedRateLimiter({
        windowMs: 50, // Very short window
        maxRequests: 5,
      })

      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      const middleware = shortLimiter.middleware()

      await middleware(req as Request, res as Response, next)

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))

      // Manually trigger cleanup
      shortLimiter['cleanup']()

      const status = await shortLimiter.getStatus('127.0.0.1')
      expect(status).toBeNull() // Should be cleaned up

      shortLimiter.destroy()
    })
  })
})

describe('createRateLimiters', () => {
  let limiters: ReturnType<typeof createRateLimiters>

  beforeEach(() => {
    limiters = createRateLimiters()
  })

  afterEach(() => {
    Object.values(limiters).forEach(limiter => limiter.destroy())
  })

  it('should create different limiters with appropriate configs', () => {
    expect(limiters.auth).toBeInstanceOf(AdvancedRateLimiter)
    expect(limiters.api).toBeInstanceOf(AdvancedRateLimiter)
    expect(limiters.static).toBeInstanceOf(AdvancedRateLimiter)
    expect(limiters.sensitive).toBeInstanceOf(AdvancedRateLimiter)
  })

  it('should have different rate limits for different types', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const next = createMockNext()

    // Auth limiter should be more restrictive
    const authMiddleware = limiters.auth.middleware()
    
    // Make requests until blocked
    let authBlocked = false
    for (let i = 0; i < 10 && !authBlocked; i++) {
      await authMiddleware(req as Request, res as Response, next)
      if (res.status && (res.status as jest.Mock).mock.calls.some(call => call[0] === 429)) {
        authBlocked = true
      }
    }

    expect(authBlocked).toBe(true)
  })
})

describe('rateLimitMiddleware', () => {
  it('should create middleware for predefined types', () => {
    const authMiddleware = rateLimitMiddleware('auth')
    const apiMiddleware = rateLimitMiddleware('api')
    const staticMiddleware = rateLimitMiddleware('static')
    const sensitiveMiddleware = rateLimitMiddleware('sensitive')

    expect(typeof authMiddleware).toBe('function')
    expect(typeof apiMiddleware).toBe('function')
    expect(typeof staticMiddleware).toBe('function')
    expect(typeof sensitiveMiddleware).toBe('function')
  })

  it('should create custom middleware with custom config', () => {
    const customMiddleware = rateLimitMiddleware('custom', {
      windowMs: 30000,
      maxRequests: 10,
    })

    expect(typeof customMiddleware).toBe('function')
  })

  it('should work with custom configuration', async () => {
    const customMiddleware = rateLimitMiddleware('custom', {
      windowMs: 60000,
      maxRequests: 2,
    })

    const req = createMockRequest()
    const res = createMockResponse()
    const next = createMockNext()

    // Should allow first 2 requests
    await customMiddleware(req as Request, res as Response, next)
    await customMiddleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(2)

    // Third request should be blocked
    await customMiddleware(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(429)
  })
})