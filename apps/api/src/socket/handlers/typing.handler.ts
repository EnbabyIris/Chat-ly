import type { Server, Socket } from 'socket.io';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { getSocketUser } from '../auth.middleware';
import type { TypingData, TypingUpdateData } from '../types';
import { SOCKET_EVENTS } from '@repo/shared/constants';

const userService = new UserService();
const chatService = new ChatService();

export class TypingHandler {
  private typingTimeouts = new Map<string, NodeJS.Timeout>(); // userId:chatId -> timeout
  private typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds

  constructor(private io: Server) {}

  /**
   * Register typing-related event handlers
   */
  registerHandlers(socket: Socket): void {
    socket.on(SOCKET_EVENTS.MESSAGE_TYPING, this.handleTyping.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  /**
   * Handle typing indicator events
   */
  private async handleTyping(
    socket: Socket,
    data: TypingData,
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

      if (!data.chatId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Chat ID is required',
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

      const typingKey = `${user.userId}:${data.chatId}`;
      
      if (data.isTyping) {
        await this.handleStartTyping(socket, user.userId, data.chatId, typingKey);
      } else {
        await this.handleStopTyping(socket, user.userId, data.chatId, typingKey);
      }
    } catch (error) {
      console.error('Error handling typing:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to handle typing indicator',
        code: 'TYPING_ERROR'
      });
    }
  }

  /**
   * Handle start typing
   */
  private async handleStartTyping(
    socket: Socket,
    userId: string,
    chatId: string,
    typingKey: string,
  ): Promise<void> {
    // Clear existing timeout
    if (this.typingTimeouts.has(typingKey)) {
      clearTimeout(this.typingTimeouts.get(typingKey)!);
    }

    // Add user to typing users for this chat
    if (!this.typingUsers.has(chatId)) {
      this.typingUsers.set(chatId, new Set());
    }
    
    const wasTyping = this.typingUsers.get(chatId)!.has(userId);
    this.typingUsers.get(chatId)!.add(userId);

    // Only broadcast if user wasn't already typing
    if (!wasTyping) {
      const userDetails = await userService.getUserById(userId);
      
      const typingData: TypingUpdateData = {
        chatId,
        userId,
        userName: userDetails.name,
        isTyping: true,
        timestamp: new Date()
      };

      // Broadcast to other participants in the chat (exclude sender)
      socket.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_TYPING_UPDATE, typingData);
    }

    // Set timeout to auto-stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.handleStopTyping(socket, userId, chatId, typingKey);
    }, 3000);
    
    this.typingTimeouts.set(typingKey, timeout);

    console.log(`✍️ User ${userId} started typing in chat ${chatId}`);
  }

  /**
   * Handle stop typing
   */
  private async handleStopTyping(
    socket: Socket,
    userId: string,
    chatId: string,
    typingKey: string,
  ): Promise<void> {
    // Clear timeout
    if (this.typingTimeouts.has(typingKey)) {
      clearTimeout(this.typingTimeouts.get(typingKey)!);
      this.typingTimeouts.delete(typingKey);
    }

    // Remove user from typing users
    const chatTypingUsers = this.typingUsers.get(chatId);
    if (chatTypingUsers && chatTypingUsers.has(userId)) {
      chatTypingUsers.delete(userId);
      
      // Clean up empty sets
      if (chatTypingUsers.size === 0) {
        this.typingUsers.delete(chatId);
      }

      // Broadcast stop typing
      const userDetails = await userService.getUserById(userId);
      
      const typingData: TypingUpdateData = {
        chatId,
        userId,
        userName: userDetails.name,
        isTyping: false,
        timestamp: new Date()
      };

      socket.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_TYPING_UPDATE, typingData);
      console.log(`✋ User ${userId} stopped typing in chat ${chatId}`);
    }
  }

  /**
   * Handle socket disconnection - clean up typing indicators
   */
  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      const user = getSocketUser(socket);
      if (!user) return;

      // Clear all typing indicators for this user
      const keysToRemove: string[] = [];
      
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        if (key.startsWith(`${user.userId}:`)) {
          clearTimeout(timeout);
          keysToRemove.push(key);
          
          // Extract chatId from key
          const chatId = key.split(':')[1];
          await this.handleStopTyping(socket, user.userId, chatId, key);
        }
      }

      // Clean up
      keysToRemove.forEach(key => this.typingTimeouts.delete(key));
      
      console.log(`🧹 Cleaned up typing indicators for user ${user.userId}`);
    } catch (error) {
      console.error('Error cleaning up typing indicators:', error);
    }
  }

  /**
   * Get currently typing users for a chat
   */
  getTypingUsers(chatId: string): string[] {
    const typingUsers = this.typingUsers.get(chatId);
    return typingUsers ? Array.from(typingUsers) : [];
  }

  /**
   * Force stop typing for a user in a specific chat
   */
  async forceStopTyping(userId: string, chatId: string): Promise<void> {
    const typingKey = `${userId}:${chatId}`;
    if (this.typingTimeouts.has(typingKey)) {
      const userDetails = await userService.getUserById(userId);
      
      const typingData: TypingUpdateData = {
        chatId,
        userId,
        userName: userDetails.name,
        isTyping: false,
        timestamp: new Date()
      };

      this.io.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_TYPING_UPDATE, typingData);
      
      clearTimeout(this.typingTimeouts.get(typingKey)!);
      this.typingTimeouts.delete(typingKey);
      
      const chatTypingUsers = this.typingUsers.get(chatId);
      if (chatTypingUsers) {
        chatTypingUsers.delete(userId);
        if (chatTypingUsers.size === 0) {
          this.typingUsers.delete(chatId);
        }
      }
    }
  }
}