import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { updateProfileSchema, userIdParamSchema, searchUsersSchema } from '@repo/shared/validations';

const router = Router();
const userController = new UserController();

// Rate limiting for user endpoints
const userRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
});

// All user routes require authentication
router.use(authenticate);
router.use(userRateLimit);

// GET /api/users - Get all users (for development/admin)
router.get(
  '/',
  userController.getAllUsers.bind(userController)
);

// GET /api/users/search - Search users
router.get(
  '/search',
  validate(searchUsersSchema),
  userController.searchUsers.bind(userController)
);

// PUT /api/users/profile - Update current user profile
router.put(
  '/profile',
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

// GET /api/users/:userId - Get user by ID
router.get(
  '/:userId',
  validate(userIdParamSchema),
  userController.getUserById.bind(userController)
);

// GET /api/users/online - Get currently online users
router.get(
  '/online',
  userController.getOnlineUsers.bind(userController)
);

export { router as userRoutes };