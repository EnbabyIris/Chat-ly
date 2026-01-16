import type { Response } from 'express';
import { ChatService } from '../services/chat.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { CreateChatDTO, UpdateChatDTO } from '@repo/shared/types';
import type { ChatIdParam } from '@repo/shared/validations';

const chatService = new ChatService();

export class ChatController {
  /**
   * Create a new chat
   * POST /api/chats
   */
  async createChat(
    req: AuthRequest & { body: CreateChatDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const chatData = req.body;

    const chat = await chatService.createChat(req.user.userId, chatData);

    return successResponse(res, { chat }, 'Chat created successfully', HTTP_STATUS.CREATED);
  }

  /**
   * Get chat by ID
   * GET /api/chats/:chatId
   */
  async getChatById(
    req: AuthRequest & { params: ChatIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;

    const chat = await chatService.getChatById(chatId, req.user.userId);

    return successResponse(res, { chat }, 'Chat retrieved successfully');
  }

  /**
   * Get user's chats
   * GET /api/chats
   */
  async getUserChats(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const chats = await chatService.getUserChats(req.user.userId);

    return successResponse(res, chats, 'Chats retrieved successfully');
  }

  /**
   * Update chat
   * PUT /api/chats/:chatId
   */
  async updateChat(
    req: AuthRequest & { params: ChatIdParam; body: UpdateChatDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const updateData = req.body;

    const chat = await chatService.updateChat(chatId, req.user.userId, updateData);

    return successResponse(res, { chat }, 'Chat updated successfully');
  }

  /**
   * Delete chat
   * DELETE /api/chats/:chatId
   */
  async deleteChat(
    req: AuthRequest & { params: ChatIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;

    await chatService.deleteChat(chatId, req.user.userId);

    return successResponse(res, null, 'Chat deleted successfully');
  }
}