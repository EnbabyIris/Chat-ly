import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import {
  createGroupChatSchema,
  addParticipantsSchema,
  removeParticipantSchema,
  transferAdminSchema,
  archiveChatSchema,
  deleteChatSchema,
} from '@repo/shared/validations';

const router = Router();
const groupController = new GroupController();

// Rate limiting for group endpoints
const groupRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window (more restrictive for group operations)
});

// All group routes require authentication
router.use(authenticate);
router.use(groupRateLimit);

// POST /api/groups - Create new group chat
router.post(
  '/',
  validate(createGroupChatSchema),
  groupController.createGroup.bind(groupController)
);

// POST /api/groups/:chatId/participants - Add participants to group
router.post(
  '/:chatId/participants',
  validate(addParticipantsSchema),
  groupController.addParticipants.bind(groupController)
);

// DELETE /api/groups/:chatId/participants/:participantId - Remove participant from group
router.delete(
  '/:chatId/participants/:participantId',
  validate(removeParticipantSchema),
  groupController.removeParticipant.bind(groupController)
);

// PUT /api/groups/:chatId/admin - Transfer admin role
router.put(
  '/:chatId/admin',
  validate(transferAdminSchema),
  groupController.transferAdmin.bind(groupController)
);

// PUT /api/groups/:chatId/archive - Archive group chat
router.put(
  '/:chatId/archive',
  validate(archiveChatSchema),
  groupController.archiveGroup.bind(groupController)
);

// DELETE /api/groups/:chatId - Delete group chat
router.delete(
  '/:chatId',
  validate(deleteChatSchema),
  groupController.deleteGroup.bind(groupController)
);

export { router as groupRoutes };