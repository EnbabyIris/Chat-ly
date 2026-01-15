import type { Server, Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
import { ChatService } from '../../services/chat.service';
import { getSocketUser } from '../auth.middleware';
import type { SendMessageData, MessageData, ReadMessageData } from '../types';
import { SOCKET_EVENTS } from '@repo/shared/constants';

const messageService = new MessageService();
const chatService = new ChatService();

export class MessageHandler {
  constructor(private io: Server) {}

  /**
   * Register message-related event handlers
   */
  registerHandlers(socket: Socket): void {
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, this.handleSendMessage.bind(this, socket));
    socket.on(SOCKET_EVENTS.MESSAGE_READ, this.handleMarkAsRead.bind(this, socket));
  }

  /**
   * Handle sending a new message
   */
  private async handleSendMessage(
    socket: Socket,
    data: SendMessageData,
  ): Promise<void> {
    try {
      const user = getSocketUser(socket);
      if (!user) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Validate required fields
      if (!data.chatId || !data.content?.trim()) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Chat ID and message content are required',
          code: 'INVALID_DATA'
        });
        return;
      }

      // Verify user is participant of the chat
      const isParticipant = await chatService.isUserParticipant(data.chatId, user.userId);
      if (!isParticipant) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'You are not a participant of this chat',
          code: 'FORBIDDEN'
        });
        return;
      }

      // Send message through service
      const message = await messageService.sendMessage(user.userId, {
        chatId: data.chatId,
        content: data.content.trim(),
        messageType: data.messageType || 'text',
        attachmentUrl: data.attachmentUrl,
        replyToId: data.replyToId,
      });

      // Format message for broadcasting
      const messageData: MessageData = {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId!,
        senderName: message.sender?.name || 'Unknown',
        senderAvatar: message.sender?.avatar || undefined,
        content: message.content,
        messageType: message.messageType as 'text' | 'image' | 'file' | 'system',
        attachmentUrl: message.attachmentUrl || undefined,
        replyToId: message.replyToId || undefined,
        isEdited: message.isEdited,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      // Broadcast to all chat participants
      this.io.to(`chat:${data.chatId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, messageData);

      console.log(`📨 Message sent in chat ${data.chatId} by ${user.userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to send message',
        code: 'SEND_MESSAGE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Handle marking message as read
   */
  private async handleMarkAsRead(
    socket: Socket,
    data: ReadMessageData,
  ): Promise<void> {
    try {
      const user = getSocketUser(socket);
      if (!user) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!data.messageId || !data.chatId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Message ID and Chat ID are required',
          code: 'INVALID_DATA'
        });
        return;
      }

      // Mark message as read
      await messageService.markMessageAsRead(data.messageId, user.userId);

      // Broadcast read receipt to chat participants
      this.io.to(`chat:${data.chatId}`).emit(SOCKET_EVENTS.MESSAGE_READ_UPDATE, {
        messageId: data.messageId,
        chatId: data.chatId,
        userId: user.userId,
        readAt: new Date()
      });

      console.log(`👁️ Message ${data.messageId} marked as read by ${user.userId}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to mark message as read',
        code: 'MARK_READ_ERROR'
      });
    }
  }

  /**
   * Broadcast message update to chat participants
   */
  async broadcastMessageUpdate(messageData: MessageData): Promise<void> {
    this.io.to(`chat:${messageData.chatId}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, messageData);
  }

  /**
   * Broadcast message deletion to chat participants
   */
  async broadcastMessageDeletion(messageId: string, chatId: string): Promise<void> {
    this.io.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      messageId,
      chatId
    });
  }
}