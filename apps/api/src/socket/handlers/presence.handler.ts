import type { Server, Socket } from 'socket.io';
import { UserService } from '../../services/user.service';
import { getSocketUser } from '../auth.middleware';
import type { OnlineUser, UserStatusData } from '../types';
import { SOCKET_EVENTS } from '@repo/shared/constants';

const userService = new UserService();

export class PresenceHandler {
  private onlineUsers = new Map<string, OnlineUser>(); // userId -> OnlineUser
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private io: Server) {}

  /**
   * Register presence-related event handlers
   */
  registerHandlers(socket: Socket): void {
    socket.on(SOCKET_EVENTS.USER_ONLINE, this.handleUserOnline.bind(this, socket));
    socket.on(SOCKET_EVENTS.USER_OFFLINE, this.handleUserOffline.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  /**
   * Handle user connection - mark as online
   */
  async handleConnection(socket: Socket): Promise<void> {
    const user = getSocketUser(socket);
    if (!user) return;

    try {
      // Get user details
      const userDetails = await userService.getUserById(user.userId);
      
      // Track socket for this user
      if (!this.userSockets.has(user.userId)) {
        this.userSockets.set(user.userId, new Set());
      }
      this.userSockets.get(user.userId)!.add(socket.id);

      // Add to online users (or update existing)
      this.onlineUsers.set(user.userId, {
        userId: user.userId,
        socketId: socket.id,
        userName: userDetails.name,
        joinedAt: new Date()
      });

      // Update user status in database
      await userService.updateUserStatus(user.userId, true);

      // Broadcast user online status
      const statusData: UserStatusData = {
        userId: user.userId,
        isOnline: true
      };

      this.io.emit(SOCKET_EVENTS.USER_STATUS, statusData);

      console.log(`🟢 User ${userDetails.name} came online`);
    } catch (error) {
      console.error('Error handling user connection:', error);
    }
  }

  /**
   * Handle explicit user online event
   */
  private async handleUserOnline(socket: Socket): Promise<void> {
    // This is already handled in handleConnection
    // But we can use this for explicit online status updates
    await this.handleConnection(socket);
  }

  /**
   * Handle explicit user offline event
   */
  private async handleUserOffline(socket: Socket): Promise<void> {
    const user = getSocketUser(socket);
    if (!user) return;

    await this.setUserOffline(user.userId, socket.id);
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnect(socket: Socket): Promise<void> {
    const user = getSocketUser(socket);
    if (!user) return;

    await this.setUserOffline(user.userId, socket.id);
  }

  /**
   * Set user as offline
   */
  private async setUserOffline(userId: string, socketId: string): Promise<void> {
    try {
      // Remove socket from user's socket set
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        
        // If user has no more active sockets, mark as offline
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          
          // Remove from online users
          const onlineUser = this.onlineUsers.get(userId);
          if (onlineUser) {
            this.onlineUsers.delete(userId);
            
            // Update user status in database
            await userService.updateUserStatus(userId, false);
            
            // Broadcast user offline status
            const statusData: UserStatusData = {
              userId,
              isOnline: false,
              lastSeen: new Date()
            };

            this.io.emit(SOCKET_EVENTS.USER_STATUS, statusData);
            
            console.log(`🔴 User ${onlineUser.userName} went offline`);
          }
        }
      }
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get user's active socket count
   */
  getUserSocketCount(userId: string): number {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size : 0;
  }

  /**
   * Broadcast status update for a specific user
   */
  async broadcastUserStatus(userId: string, isOnline: boolean): Promise<void> {
    const statusData: UserStatusData = {
      userId,
      isOnline,
      lastSeen: isOnline ? undefined : new Date()
    };

    this.io.emit(SOCKET_EVENTS.USER_STATUS, statusData);
  }

  /**
   * Get online users for a specific chat
   */
  async getOnlineUsersForChat(chatId: string): Promise<string[]> {
    // Get all sockets in the chat room
    const room = this.io.sockets.adapter.rooms.get(`chat:${chatId}`);
    if (!room) return [];

    const onlineUsersInChat: string[] = [];
    
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        const user = getSocketUser(socket);
        if (user && !onlineUsersInChat.includes(user.userId)) {
          onlineUsersInChat.push(user.userId);
        }
      }
    }
    
    return onlineUsersInChat;
  }

  /**
   * Force user offline (for admin purposes)
   */
  async forceUserOffline(userId: string): Promise<void> {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      // Disconnect all user's sockets
      for (const socketId of userSocketSet) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
    
    await this.setUserOffline(userId, '');
  }
}