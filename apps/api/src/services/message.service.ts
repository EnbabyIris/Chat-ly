import { db, messages, messageReadReceipts } from '../db';
import { eq, and, desc, lt } from 'drizzle-orm';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import { ChatService } from './chat.service';
import type { SendMessageDTO, UpdateMessageDTO } from '@repo/shared/types';

const chatService = new ChatService();

export class MessageService {
  async sendMessage(userId: string, data: SendMessageDTO) {
    // Verify user is participant
    const isParticipant = await chatService.isUserParticipant(data.chatId, userId);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    // Create message
    const messageData: any = {
      chatId: data.chatId,
      senderId: userId,
      content: data.content,
      messageType: data.messageType || 'text',
    };

    // Add optional fields if they exist
    if (data.attachmentUrl) messageData.attachmentUrl = data.attachmentUrl;
    if (data.attachmentName) messageData.attachmentName = data.attachmentName;
    if (data.attachmentSize) messageData.attachmentSize = data.attachmentSize;
    if (data.latitude !== undefined) messageData.latitude = data.latitude.toString();
    if (data.longitude !== undefined) messageData.longitude = data.longitude.toString();
    if (data.locationAddress) messageData.locationAddress = data.locationAddress;
    if (data.replyToId) messageData.replyToId = data.replyToId;

    const [newMessage] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    // Fetch message with sender info
    return this.getMessageById(newMessage.id);
  }

  async getMessageById(messageId: string) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readReceipts: true,
      },
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    return message;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50, before?: string) {
    // Verify user is participant
    const isParticipant = await chatService.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    const conditions = [eq(messages.chatId, chatId), eq(messages.isDeleted, false)];

    if (before) {
      conditions.push(lt(messages.createdAt, new Date(before)));
    }

    const chatMessages = await db.query.messages.findMany({
      where: and(...conditions),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readReceipts: true,
      },
      orderBy: desc(messages.createdAt),
      limit,
    });

    return chatMessages.reverse(); // Return in chronological order
  }

  async updateMessage(messageId: string, userId: string, data: UpdateMessageDTO) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.CANNOT_EDIT_MESSAGE);
    }

    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: data.content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return this.getMessageById(updatedMessage.id);
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.CANNOT_DELETE_MESSAGE);
    }

    await db
      .update(messages)
      .set({
        isDeleted: true,
        content: 'This message has been deleted',
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  async markMessageAsRead(messageId: string, userId: string) {
    // Check if already read
    const existing = await db.query.messageReadReceipts.findFirst({
      where: and(
        eq(messageReadReceipts.messageId, messageId),
        eq(messageReadReceipts.userId, userId),
      ),
    });

    if (existing) {
      return;
    }

    await db.insert(messageReadReceipts).values({
      messageId,
      userId,
    });
  }
}