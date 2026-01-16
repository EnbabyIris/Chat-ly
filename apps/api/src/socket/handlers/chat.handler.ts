import type { Socket } from 'socket.io';
import { ChatService } from '../../services/chat.service';
import { getSocketUser } from '../auth.middleware';
import type { ChatRoom } from '../types';
import { SOCKET_EVENTS } from '@repo/shared/constants';

const chatService = new ChatService();

export class ChatHandler {
  private chatRooms = new Map<string, ChatRoom>();

  constructor(_io: any) {
    // Initialize chat handler
  }

  /**
   * Register chat-related event handlers
   */
  registerHandlers(socket: Socket): void {
    socket.on(SOCKET_EVENTS.CHAT_JOIN, this.handleJoinChat.bind(this, socket));
    socket.on(SOCKET_EVENTS.CHAT_LEAVE, this.handleLeaveChat.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  /**
   * Handle user joining a chat room
   */
  private async handleJoinChat(
    socket: Socket,
    data: { chatId: string },
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

      // Join socket room
      await socket.join(`chat:${data.chatId}`);

      // Use cached user info from socket (no DB call needed!)

      // Update chat room tracking
      if (!this.chatRooms.has(data.chatId)) {
        this.chatRooms.set(data.chatId, {
          chatId: data.chatId,
          participants: new Set(),
          typingUsers: new Map()
        });
      }

      const room = this.chatRooms.get(data.chatId)!;
      room.participants.add(user.userId);

      // Notify other participants that user joined
      socket.to(`chat:${data.chatId}`).emit(SOCKET_EVENTS.CHAT_USER_JOINED, {
        chatId: data.chatId,
        user: {
          id: user.userId,
          name: user.userName,
          avatar: user.userAvatar
        }
      });

      console.log(`🏠 User ${user.userName} joined chat ${data.chatId}`);
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to join chat',
        code: 'JOIN_CHAT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Handle user leaving a chat room
   */
  private async handleLeaveChat(
    socket: Socket,
    data: { chatId: string },
  ): Promise<void> {
    try {
      const user = getSocketUser(socket);
      if (!user) return;

      if (!data.chatId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Chat ID is required',
          code: 'INVALID_DATA'
        });
        return;
      }

      // Leave socket room
      await socket.leave(`chat:${data.chatId}`);

      // Update chat room tracking
      const room = this.chatRooms.get(data.chatId);
      if (room) {
        room.participants.delete(user.userId);
        room.typingUsers.delete(user.userId);

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.chatRooms.delete(data.chatId);
        }
      }

      // Use cached user info from socket (no DB call needed!)

      // Notify other participants that user left
      socket.to(`chat:${data.chatId}`).emit(SOCKET_EVENTS.CHAT_USER_LEFT, {
        chatId: data.chatId,
        user: {
          id: user.userId,
          name: user.userName,
          avatar: user.userAvatar
        }
      });

      console.log(`🚪 User ${user.userName} left chat ${data.chatId}`);
    } catch (error) {
      console.error('Error leaving chat:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to leave chat',
        code: 'LEAVE_CHAT_ERROR'
      });
    }
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      const user = getSocketUser(socket);
      if (!user) return;

      // Remove user from all chat rooms
      for (const [chatId, room] of this.chatRooms.entries()) {
        if (room.participants.has(user.userId)) {
          room.participants.delete(user.userId);
          room.typingUsers.delete(user.userId);

          // Use cached user info from socket (no DB call needed!)
          socket.to(`chat:${chatId}`).emit(SOCKET_EVENTS.CHAT_USER_LEFT, {
            chatId,
            user: {
              id: user.userId,
              name: user.userName,
              avatar: user.userAvatar
            }
          });

          // Clean up empty rooms
          if (room.participants.size === 0) {
            this.chatRooms.delete(chatId);
          }
        }
      }

      console.log(`🔌 User ${user.userId} disconnected from all chats`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  /**
   * Get chat room information
   */
  getChatRoom(chatId: string): ChatRoom | undefined {
    return this.chatRooms.get(chatId);
  }

  /**
   * Get all active chat rooms
   */
  getAllChatRooms(): Map<string, ChatRoom> {
    return this.chatRooms;
  }
}