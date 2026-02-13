import type { Request, Response, NextFunction } from "express";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
  whitelist?: string[];
  blacklist?: string[];
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsPerWindow: number;
  remainingPoints: number;
  msBeforeNext: number;
  isBlocked: boolean;
}

export interface UserRateLimit {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

export class AdvancedRateLimiter {
  private store: Map<string, UserRateLimit> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => req.ip || "unknown",
      whitelist: [],
      blacklist: [],
      ...config,
    };

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Creates rate limiting middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator!(req);

        // Check whitelist
        if (this.config.whitelist?.includes(key)) {
          return next();
        }

        // Check blacklist
        if (this.config.blacklist?.includes(key)) {
          return this.handleBlocked(req, res, "IP blacklisted");
        }

        const rateLimitInfo = await this.checkLimit(key);

        // Add rate limit headers
        this.setRateLimitHeaders(res, rateLimitInfo);

        if (rateLimitInfo.isBlocked) {
          return this.handleBlocked(req, res, "Rate limit exceeded");
        }

        // Track the request
        this.trackRequest(key, req, res);

        next();
      } catch (error) {
        console.error("Rate limiter error:", error);
        // Fail open - allow request if rate limiter fails
        next();
      }
    };
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(key: string): Promise<RateLimitInfo> {
    const now = Date.now();

    let userLimit = this.store.get(key);

    // Initialize or reset if window expired
    if (!userLimit || userLimit.resetTime <= now) {
      userLimit = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      };
      this.store.set(key, userLimit);
    }

    // Check if user is temporarily blocked
    if (
      userLimit.blocked &&
      userLimit.blockUntil &&
      userLimit.blockUntil > now
    ) {
      return {
        totalHits: userLimit.count,
        totalHitsPerWindow: userLimit.count,
        remainingPoints: 0,
        msBeforeNext: userLimit.blockUntil - now,
        isBlocked: true,
      };
    }

    // Reset block if expired
    if (
      userLimit.blocked &&
      userLimit.blockUntil &&
      userLimit.blockUntil <= now
    ) {
      userLimit.blocked = false;
      userLimit.blockUntil = undefined;
      userLimit.count = 0;
      userLimit.resetTime = now + this.config.windowMs;
    }

    const remainingPoints = Math.max(
      0,
      this.config.maxRequests - userLimit.count,
    );
    const isBlocked = userLimit.count >= this.config.maxRequests;

    return {
      totalHits: userLimit.count,
      totalHitsPerWindow: userLimit.count,
      remainingPoints,
      msBeforeNext: userLimit.resetTime - now,
      isBlocked,
    };
  }

  /**
   * Track a request
   */
  private trackRequest(key: string, _req: Request, res: Response): void {
    const userLimit = this.store.get(key);
    if (!userLimit) return;

    // Increment counter
    userLimit.count++;

    // Check if we should skip based on response
    res.on("finish", () => {
      const statusCode = res.statusCode;

      if (this.config.skipSuccessfulRequests && statusCode < 400) {
        userLimit.count = Math.max(0, userLimit.count - 1);
      }

      if (this.config.skipFailedRequests && statusCode >= 400) {
        userLimit.count = Math.max(0, userLimit.count - 1);
      }

      // Apply progressive blocking for repeated violations
      if (userLimit.count >= this.config.maxRequests * 2) {
        userLimit.blocked = true;
        userLimit.blockUntil = Date.now() + this.config.windowMs * 2; // Block for 2 windows
      }
    });

    this.store.set(key, userLimit);
  }

  /**
   * Handle blocked requests
   */
  private handleBlocked(req: Request, res: Response, reason: string): void {
    if (this.config.onLimitReached) {
      this.config.onLimitReached(req, res);
    }

    res.status(429).json({
      error: "Too Many Requests",
      message: reason,
      retryAfter: Math.ceil(this.config.windowMs / 1000),
    });
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
    res.set({
      "X-RateLimit-Limit": this.config.maxRequests.toString(),
      "X-RateLimit-Remaining": info.remainingPoints.toString(),
      "X-RateLimit-Reset": new Date(
        Date.now() + info.msBeforeNext,
      ).toISOString(),
      "X-RateLimit-Window": this.config.windowMs.toString(),
    });

    if (info.isBlocked) {
      res.set("Retry-After", Math.ceil(info.msBeforeNext / 1000).toString());
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, userLimit] of this.store.entries()) {
      // Remove expired entries
      if (userLimit.resetTime <= now && !userLimit.blocked) {
        this.store.delete(key);
      }

      // Remove expired blocks
      if (
        userLimit.blocked &&
        userLimit.blockUntil &&
        userLimit.blockUntil <= now
      ) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current rate limit status for a key
   */
  async getStatus(key: string): Promise<RateLimitInfo | null> {
    const userLimit = this.store.get(key);
    if (!userLimit) return null;

    return this.checkLimit(key);
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip: string): void {
    if (!this.config.whitelist?.includes(ip)) {
      this.config.whitelist?.push(ip);
    }
  }

  /**
   * Remove IP from whitelist
   */
  removeFromWhitelist(ip: string): void {
    if (this.config.whitelist) {
      this.config.whitelist = this.config.whitelist.filter(
        (item) => item !== ip,
      );
    }
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip: string): void {
    if (!this.config.blacklist?.includes(ip)) {
      this.config.blacklist?.push(ip);
    }
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip: string): void {
    if (this.config.blacklist) {
      this.config.blacklist = this.config.blacklist.filter(
        (item) => item !== ip,
      );
    }
  }

  /**
   * Get rate limiting statistics
   */
  getStatistics(): {
    totalActiveKeys: number;
    totalBlockedKeys: number;
    averageRequestsPerKey: number;
    topRequesters: Array<{ key: string; requests: number }>;
  } {
    const stats = {
      totalActiveKeys: this.store.size,
      totalBlockedKeys: 0,
      averageRequestsPerKey: 0,
      topRequesters: [] as Array<{ key: string; requests: number }>,
    };

    let totalRequests = 0;
    const requesters: Array<{ key: string; requests: number }> = [];

    for (const [key, userLimit] of this.store.entries()) {
      if (userLimit.blocked) {
        stats.totalBlockedKeys++;
      }

      totalRequests += userLimit.count;
      requesters.push({ key, requests: userLimit.count });
    }

    stats.averageRequestsPerKey =
      stats.totalActiveKeys > 0 ? totalRequests / stats.totalActiveKeys : 0;

    // Sort and get top 10 requesters
    stats.topRequesters = requesters
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return stats;
  }

  /**
   * Export current state (for persistence)
   */
  exportState(): Record<string, UserRateLimit> {
    const state: Record<string, UserRateLimit> = {};

    for (const [key, userLimit] of this.store.entries()) {
      state[key] = { ...userLimit };
    }

    return state;
  }

  /**
   * Import state (for persistence)
   */
  importState(state: Record<string, UserRateLimit>): void {
    this.store.clear();

    for (const [key, userLimit] of Object.entries(state)) {
      this.store.set(key, userLimit);
    }
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * Create different rate limiters for different endpoints
 */
export const createRateLimiters = () => {
  return {
    // Strict rate limiting for auth endpoints
    auth: new AdvancedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      keyGenerator: (req) => `auth_${req.ip}_${req.body?.email || "unknown"}`,
      onLimitReached: (req, _res) => {
        console.warn(`Auth rate limit exceeded for ${req.ip}`);
      },
    }),

    // Moderate rate limiting for API endpoints
    api: new AdvancedRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      skipSuccessfulRequests: false,
      skipFailedRequests: true,
    }),

    // Lenient rate limiting for static content
    static: new AdvancedRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000, // 1000 requests per minute
      skipSuccessfulRequests: true,
    }),

    // Very strict for sensitive operations
    sensitive: new AdvancedRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 requests per hour
      keyGenerator: (req) =>
        `sensitive_${req.ip}_${(req as any).user?.id || "anonymous"}`,
    }),
  };
};

/**
 * Middleware factory for easy setup
 */
export const rateLimitMiddleware = (
  type: "auth" | "api" | "static" | "sensitive",
  customConfig?: RateLimitConfig,
) => {
  if (customConfig) {
    const limiter = new AdvancedRateLimiter(customConfig);
    return limiter.middleware();
  }

  const limiters = createRateLimiters();
  return limiters[type].middleware();
};
