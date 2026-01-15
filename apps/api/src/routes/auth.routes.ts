import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { registerSchema, loginSchema, refreshTokenSchema } from '@repo/shared/validations';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints (stricter limits)
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
});

// Public routes
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  authRateLimit,
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser.bind(authController)
);

export { router as authRoutes };