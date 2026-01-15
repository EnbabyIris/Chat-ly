import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { getChatMessagesSchema } from '@repo/shared/validations';

const router = Router();
const messageController = new MessageController();

// Rate limiting for chat message retrieval
const chatMessagesRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 300, // 300 requests per window
});

// All routes require authentication
router.use(authenticate);
router.use(chatMessagesRateLimit);

// GET /api/chats/:chatId/messages - Get messages for a chat
router.get(
  '/:chatId/messages',
  validate(getChatMessagesSchema),
  messageController.getChatMessages.bind(messageController)
);

export { router as chatMessagesRoutes };