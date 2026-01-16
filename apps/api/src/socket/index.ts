import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { socketAuthMiddleware, getSocketUser } from './auth.middleware';
import { MessageHandler } from './handlers/message.handler';
import { ChatHandler } from './handlers/chat.handler';
import { TypingHandler } from './handlers/typing.handler';
import { PresenceHandler } from './handlers/presence.handler';
import { SOCKET_EVENTS } from '@repo/shared/constants';
import type { SocketEvents } from './types';
import { ChatService } from '../services/chat.service';

export class SocketIOServer {
  private io: Server<SocketEvents>;
  private messageHandler: MessageHandler;
  private chatHandler: ChatHandler;
  private typingHandler: TypingHandler;
  private presenceHandler: PresenceHandler;
  private chatService: ChatService;

  constructor(httpServer: HttpServer) {
    // Initialize Socket.IO server
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    // Initialize handlers
    this.messageHandler = new MessageHandler(this.io);
    this.chatHandler = new ChatHandler(this.io);
    this.typingHandler = new TypingHandler(this.io);
    this.presenceHandler = new PresenceHandler(this.io);
    this.chatService = new ChatService();

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupConnectionHandling();
  }

  /**
   * Setup Socket.IO middleware
   */
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(socketAuthMiddleware);
  }

  /**
   * Setup connection handling
   */
  private setupConnectionHandling(): void {
    this.io.on('connection', async (socket: Socket) => {
      const user = getSocketUser(socket);
      
      if (!user) {
        console.error('❌ Socket connected without authentication');
        socket.disconnect();
        return;
      }

      console.log(`🔌 Socket connected: ${user.userId} (${socket.id})`);

      // Handle user coming online
      await this.presenceHandler.handleConnection(socket);

      // Auto-join user to all their chats so real-time messages arrive instantly
      // even when the chat isn't currently open on the frontend.
      try {
        const userChats = await this.chatService.getUserChats(user.userId);
        const rooms = userChats.map((chat) => `chat:${chat.id}`);
        if (rooms.length > 0) {
          await socket.join(rooms);
        }
      } catch (error) {
        console.error('Failed to auto-join user chat rooms:', error);
      }

      // Emit authentication success
      socket.emit('authenticated', { 
        success: true, 
        user: { id: user.userId, email: user.email } 
      });

      // Register all event handlers
      this.registerEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`🔌 Socket disconnected: ${user.userId} (${reason})`);
      });
    });
  }

  /**
   * Register event handlers for a socket
   */
  private registerEventHandlers(socket: Socket): void {
    // Register handlers from each handler class
    this.messageHandler.registerHandlers(socket);
    this.chatHandler.registerHandlers(socket);
    this.typingHandler.registerHandlers(socket);
    this.presenceHandler.registerHandlers(socket);

    // Handle generic errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'An error occurred',
        code: 'SOCKET_ERROR'
      });
    });
  }

  /**
   * Setup global event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Log server statistics periodically
    setInterval(() => {
      const connectedSockets = this.io.engine.clientsCount;
      const onlineUsers = this.presenceHandler.getOnlineUserCount();
      const activeRooms = this.chatHandler.getAllChatRooms().size;
      
      console.log(`📊 Socket.IO Stats: ${connectedSockets} sockets, ${onlineUsers} users online, ${activeRooms} active chats`);
    }, 60000); // Log every minute
  }

  /**
   * Get Socket.IO server instance
   */
  getServer(): Server<SocketEvents> {
    return this.io;
  }

  /**
   * Get message handler for external access
   */
  getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  /**
   * Get chat handler for external access
   */
  getChatHandler(): ChatHandler {
    return this.chatHandler;
  }

  /**
   * Get typing handler for external access
   */
  getTypingHandler(): TypingHandler {
    return this.typingHandler;
  }

  /**
   * Get presence handler for external access
   */
  getPresenceHandler(): PresenceHandler {
    return this.presenceHandler;
  }


  /**
   * Broadcast message to specific users
   */
  async broadcastToUsers(userIds: string[], event: keyof SocketEvents, data: any): Promise<void> {
    for (const userId of userIds) {
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      sockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }

  /**
   * Get real-time statistics
   */
  getStats(): {
    connectedSockets: number;
    onlineUsers: number;
    activeChats: number;
  } {
    return {
      connectedSockets: this.io.engine.clientsCount,
      onlineUsers: this.presenceHandler.getOnlineUserCount(),
      activeChats: this.chatHandler.getAllChatRooms().size
    };
  }

  /**
   * Gracefully close the Socket.IO server
   */
  async close(): Promise<void> {
    console.log('🔌 Closing Socket.IO server...');
    
    // Set all users offline
    const onlineUsers = this.presenceHandler.getOnlineUsers();
    for (const user of onlineUsers) {
      await this.presenceHandler.broadcastUserStatus(user.userId, false);
    }
    
    this.io.close();
    console.log('✅ Socket.IO server closed');
  }
}

// Export singleton instance creation function
export const createSocketIOServer = (httpServer: HttpServer): SocketIOServer => {
  return new SocketIOServer(httpServer);
};

export * from './types';
export * from './handlers/message.handler';
export * from './handlers/chat.handler';
export * from './handlers/typing.handler';
export * from './handlers/presence.handler';