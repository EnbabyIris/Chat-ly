import type { Server, Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
import { getSocketUser } from '../auth.middleware';
import type { SendMessageData, MessageData, ReadMessageData } from '../types';
import { SOCKET_EVENTS } from '@repo/shared/constants';

const messageService = new MessageService();

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

      const chatRoom = `chat:${data.chatId}`;

      // Use cached user info from socket (no DB call needed!)
      const tempMessage: MessageData = {
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for instant delivery
        chatId: data.chatId,
        senderId: user.userId,
        senderName: user.userName,
        senderAvatar: user.userAvatar || undefined,
        sender: {
          id: user.userId,
          name: user.userName,
          avatar: user.userAvatar || undefined,
        },
        content: data.content.trim(),
        messageType: data.messageType as 'text' | 'image' | 'file' | 'system' || 'text',
        attachmentUrl: data.attachmentUrl || undefined,
        replyToId: data.replyToId || undefined,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // INSTANT BROADCAST
      // - Always echo to sender immediately (even if room join is delayed)
      // - Broadcast to everyone else via chat room
      socket.emit(SOCKET_EVENTS.MESSAGE_NEW, tempMessage);
      socket.to(chatRoom).emit(SOCKET_EVENTS.MESSAGE_NEW, tempMessage);
      
      console.log(`⚡ INSTANT message broadcast for chat ${data.chatId}`);

      // Save to database in background (async, non-blocking)
      messageService.sendMessage(user.userId, {
        chatId: data.chatId,
        content: data.content.trim(),
        messageType: data.messageType || 'text',
        attachmentUrl: data.attachmentUrl,
        replyToId: data.replyToId,
      }).then((savedMessage) => {
        // Send update with real DB ID (optional - for perfect consistency)
        const realMessageData: MessageData = {
          id: savedMessage.id, // Real database ID
          chatId: savedMessage.chatId,
          senderId: savedMessage.senderId!,
          senderName: savedMessage.sender?.name || user.userName,
          senderAvatar: savedMessage.sender?.avatar || user.userAvatar || undefined,
          sender: {
            id: savedMessage.senderId!,
            name: savedMessage.sender?.name || user.userName,
            avatar: savedMessage.sender?.avatar || user.userAvatar || undefined,
          },
          content: savedMessage.content,
          messageType: savedMessage.messageType as 'text' | 'image' | 'file' | 'system',
          attachmentUrl: savedMessage.attachmentUrl || undefined,
          replyToId: savedMessage.replyToId || undefined,
          isEdited: savedMessage.isEdited,
          createdAt: savedMessage.createdAt,
          updatedAt: savedMessage.updatedAt,
        };

        // Update clients with real DB ID (replaces temp message)
        this.io.to(chatRoom).emit('message:db_saved', {
          tempId: tempMessage.id,
          realMessage: realMessageData
        });

        console.log(`💾 Message saved to DB with ID: ${savedMessage.id}`);
      }).catch((error) => {
        console.error('❌ Failed to save message to DB:', error);
        
        // Notify clients of failure
        this.io.to(chatRoom).emit('message:save_failed', {
          tempId: tempMessage.id,
          error: 'Failed to save message'
        });
      });

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