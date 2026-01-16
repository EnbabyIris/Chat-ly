import type { Response } from 'express';
import { ChatService } from '../services/chat.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type {
  CreateGroupChatDTO,
  GroupChatCreationResponse,
  ParticipantOperationResponse,
  ArchiveOperationResponse
} from '@repo/shared/types';
import type {
  AddParticipantsInput,
  RemoveParticipantInput,
  TransferAdminInput,
  ArchiveChatInput,
  DeleteChatInput
} from '@repo/shared/validations';

const chatService = new ChatService();

export class GroupController {
  /**
   * Create a new group chat
   * POST /api/groups
   */
  async createGroup(
    req: AuthRequest & { body: CreateGroupChatDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const groupData = req.body;

    // Convert to the existing CreateChatDTO format
    const chatData = {
      participantIds: groupData.participantIds,
      isGroupChat: true as const,
      name: groupData.name,
      avatar: groupData.avatar,
      description: groupData.description,
    };

    const chat = await chatService.createChat(req.user.userId, chatData);

    const response: GroupChatCreationResponse = {
      chat: chat as any, // Type assertion needed due to existing type mismatch
      participants: chat.participants as any,
      success: true,
    };

    return successResponse(res, response, 'Group created successfully', HTTP_STATUS.CREATED);
  }

  /**
   * Add participants to a group
   * POST /api/groups/:chatId/participants
   */
  async addParticipants(
    req: AuthRequest & AddParticipantsInput,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const { participantIds } = req.body;

    await chatService.addParticipants(chatId, req.user.userId, participantIds);

    const response: ParticipantOperationResponse = {
      chatId,
      participantId: participantIds[0], // Primary participant added
      operation: 'added',
      success: true,
    };

    return successResponse(res, response, 'Participants added successfully');
  }

  /**
   * Remove a participant from a group
   * DELETE /api/groups/:chatId/participants/:participantId
   */
  async removeParticipant(
    req: AuthRequest & RemoveParticipantInput,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId, participantId } = req.params;

    await chatService.removeParticipant(chatId, req.user.userId, participantId);

    const response: ParticipantOperationResponse = {
      chatId,
      participantId,
      operation: 'removed',
      success: true,
    };

    return successResponse(res, response, 'Participant removed successfully');
  }

  /**
   * Transfer admin role to another participant
   * PUT /api/groups/:chatId/admin
   */
  async transferAdmin(
    req: AuthRequest & TransferAdminInput,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const { newAdminId } = req.body;

    await chatService.transferAdmin(chatId, req.user.userId, newAdminId);

    const response: ParticipantOperationResponse = {
      chatId,
      participantId: newAdminId,
      operation: 'admin_transferred',
      newAdminId,
      success: true,
    };

    return successResponse(res, response, 'Admin role transferred successfully');
  }

  /**
   * Archive a group chat (soft delete)
   * PUT /api/groups/:chatId/archive
   */
  async archiveGroup(
    req: AuthRequest & ArchiveChatInput,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;

    await chatService.archiveGroup(chatId, req.user.userId);

    const response: ArchiveOperationResponse = {
      chatId,
      operation: 'archived',
      success: true,
    };

    return successResponse(res, response, 'Group archived successfully');
  }

  /**
   * Delete a group chat (hard delete)
   * DELETE /api/groups/:chatId
   */
  async deleteGroup(
    req: AuthRequest & DeleteChatInput,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const { hardDelete } = req.body;

    await chatService.deleteGroup(chatId, req.user.userId, hardDelete);

    const response: ArchiveOperationResponse = {
      chatId,
      operation: 'deleted',
      success: true,
    };

    return successResponse(res, response, 'Group deleted successfully');
  }
}