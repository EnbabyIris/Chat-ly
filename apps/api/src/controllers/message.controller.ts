import type { Response } from 'express';
import { MessageService } from '../services/message.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { SendMessageDTO, UpdateMessageDTO } from '@repo/shared/types';
import type { MessageIdParam, GetChatMessagesInput } from '@repo/shared/validations';

const messageService = new MessageService();

export class MessageController {
  /**
   * Send a message
   * POST /api/messages
   */
  async sendMessage(
    req: AuthRequest & { body: SendMessageDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const messageData = req.body;

    const message = await messageService.sendMessage(req.user.userId, messageData);

    return successResponse(res, { message }, 'Message sent successfully', HTTP_STATUS.CREATED);
  }

  /**
   * Get chat messages
   * GET /api/chats/:chatId/messages
   */
  async getChatMessages(
    req: AuthRequest & { params: { chatId: string }; query: Omit<GetChatMessagesInput, 'chatId'> },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const { limit, before } = req.query;

    const messages = await messageService.getChatMessages(
      chatId,
      req.user.userId,
      limit ? parseInt(limit as string, 10) : undefined,
      before as string | undefined,
    );

    return successResponse(res, { messages }, 'Messages retrieved successfully');
  }

  /**
   * Update message
   * PUT /api/messages/:messageId
   */
  async updateMessage(
    req: AuthRequest & { params: MessageIdParam; body: UpdateMessageDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { messageId } = req.params;
    const updateData = req.body;

    const message = await messageService.updateMessage(messageId, req.user.userId, updateData);

    return successResponse(res, { message }, 'Message updated successfully');
  }

  /**
   * Delete message
   * DELETE /api/messages/:messageId
   */
  async deleteMessage(
    req: AuthRequest & { params: MessageIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { messageId } = req.params;

    await messageService.deleteMessage(messageId, req.user.userId);

    return successResponse(res, null, 'Message deleted successfully');
  }

  /**
   * Mark message as read
   * POST /api/messages/:messageId/read
   */
  async markMessageAsRead(
    req: AuthRequest & { params: MessageIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { messageId } = req.params;

    await messageService.markMessageAsRead(messageId, req.user.userId);

    return successResponse(res, null, 'Message marked as read');
  }
}