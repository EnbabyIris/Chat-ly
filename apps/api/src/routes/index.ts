import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { chatRoutes } from './chat.routes';
import { messageRoutes } from './message.routes';
import { chatMessagesRoutes } from './chat-messages.routes';
import { groupRoutes } from './group.routes';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat-Turbo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version prefix
const API_VERSION = '/api/v1';

// Mount route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/chats`, chatRoutes);
router.use(`${API_VERSION}/chats`, chatMessagesRoutes); // Nested route: /chats/:chatId/messages
router.use(`${API_VERSION}/groups`, groupRoutes);
router.use(`${API_VERSION}/messages`, messageRoutes);

// API documentation endpoint
router.get(`${API_VERSION}`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat-Turbo API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'User login',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'User logout',
        'GET /auth/me': 'Get current user profile'
      },
      users: {
        'GET /users': 'Get all users',
        'GET /users/search': 'Search users',
        'GET /users/:userId': 'Get user by ID',
        'PUT /users/profile': 'Update current user profile'
      },
      chats: {
        'GET /chats': 'Get user chats',
        'POST /chats': 'Create new chat',
        'GET /chats/:chatId': 'Get chat by ID',
        'PUT /chats/:chatId': 'Update chat',
        'DELETE /chats/:chatId': 'Delete chat',
        'GET /chats/:chatId/messages': 'Get chat messages'
      },
      groups: {
        'POST /groups': 'Create new group chat',
        'POST /groups/:chatId/participants': 'Add participants to group',
        'DELETE /groups/:chatId/participants/:participantId': 'Remove participant from group',
        'PUT /groups/:chatId/admin': 'Transfer admin role',
        'PUT /groups/:chatId/archive': 'Archive group chat',
        'DELETE /groups/:chatId': 'Delete group chat'
      },
      messages: {
        'POST /messages': 'Send new message',
        'PUT /messages/:messageId': 'Update message',
        'DELETE /messages/:messageId': 'Delete message',
        'POST /messages/:messageId/read': 'Mark message as read'
      }
    }
  });
});

// 404 handler for unknown routes
router.use('*', notFoundHandler);

// Global error handler
router.use(errorHandler);

export { router as apiRoutes };