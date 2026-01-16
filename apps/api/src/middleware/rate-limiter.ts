import type { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
}) => {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
      });
      return;
    }

    next();
  };
};

// Clean up expired entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 3600000);