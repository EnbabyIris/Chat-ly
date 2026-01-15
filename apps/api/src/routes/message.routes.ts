import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { 
  sendMessageSchema, 
  updateMessageSchema, 
  messageIdParamSchema
} from '@repo/shared/validations';

const router = Router();
const messageController = new MessageController();

// Rate limiting for message endpoints (higher limits for real-time messaging)
const messageRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 500 requests per window for active messaging
});

// All message routes require authentication
router.use(authenticate);
router.use(messageRateLimit);

// POST /api/messages - Send new message
router.post(
  '/',
  validate(sendMessageSchema),
  messageController.sendMessage.bind(messageController)
);

// PUT /api/messages/:messageId - Update message
router.put(
  '/:messageId',
  validate(messageIdParamSchema),
  validate(updateMessageSchema),
  messageController.updateMessage.bind(messageController)
);

// DELETE /api/messages/:messageId - Delete message
router.delete(
  '/:messageId',
  validate(messageIdParamSchema),
  messageController.deleteMessage.bind(messageController)
);

// POST /api/messages/:messageId/read - Mark message as read
router.post(
  '/:messageId/read',
  validate(messageIdParamSchema),
  messageController.markMessageAsRead.bind(messageController)
);

export { router as messageRoutes };