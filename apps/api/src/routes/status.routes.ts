import { Router } from 'express';
import { StatusController } from '../controllers/status.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { createStatusSchema, statusIdParamSchema } from '@repo/shared/validations';

const router = Router();
const statusController = new StatusController();

// Rate limiting for status endpoints (more lenient than messages)
const statusRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 status operations per window (create, view, delete)
});

// All status routes require authentication
router.use(authenticate);
router.use(statusRateLimit);

// POST /api/statuses - Create a new status
router.post(
  '/',
  validate(createStatusSchema),
  statusController.createStatus.bind(statusController)
);

// GET /api/statuses/my - Get current user's statuses
router.get(
  '/my',
  statusController.getMyStatuses.bind(statusController)
);

// GET /api/statuses - Get all statuses from all users
router.get(
  '/',
  statusController.getAllStatuses.bind(statusController)
);

// GET /api/statuses/:statusId - Get a specific status
router.get(
  '/:statusId',
  validate(statusIdParamSchema),
  statusController.getStatusById.bind(statusController)
);

// DELETE /api/statuses/:statusId - Delete a status
router.delete(
  '/:statusId',
  validate(statusIdParamSchema),
  statusController.deleteStatus.bind(statusController)
);

export { router as statusRoutes };