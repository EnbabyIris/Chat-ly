import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';
import { createChatSchema, updateChatSchema, chatIdParamSchema } from '@repo/shared/validations';

const router = Router();
const chatController = new ChatController();

// Rate limiting for chat endpoints
const chatRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per window
});

// All chat routes require authentication
router.use(authenticate);
router.use(chatRateLimit);

// GET /api/chats - Get user's chats
router.get(
  '/',
  chatController.getUserChats.bind(chatController)
);

// POST /api/chats - Create new chat
router.post(
  '/',
  validate(createChatSchema),
  chatController.createChat.bind(chatController)
);

// GET /api/chats/:chatId - Get chat by ID
router.get(
  '/:chatId',
  validate(chatIdParamSchema),
  chatController.getChatById.bind(chatController)
);

// PUT /api/chats/:chatId - Update chat
router.put(
  '/:chatId',
  validate(chatIdParamSchema),
  validate(updateChatSchema),
  chatController.updateChat.bind(chatController)
);

// DELETE /api/chats/:chatId - Delete chat
router.delete(
  '/:chatId',
  validate(chatIdParamSchema),
  chatController.deleteChat.bind(chatController)
);

export { router as chatRoutes };