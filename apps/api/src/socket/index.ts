import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { socketAuthMiddleware, getSocketUser } from "./auth.middleware";
import { MessageHandler } from "./handlers/message.handler";
import { PresenceHandler } from "./handlers/presence.handler";
import { SOCKET_EVENTS } from "@repo/shared/constants";
import type { SocketEvents } from "./types";
import { ChatService } from "../services/chat.service";
import { setIOInstance } from "./io-instance";

export class SocketIOServer {
  private io: Server<SocketEvents>;
  private messageHandler: MessageHandler;
  private presenceHandler: PresenceHandler;
  private chatService: ChatService;

  constructor(httpServer: HttpServer) {
    // Initialize Socket.IO server
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // Allow all origins - accessible from anywhere in the world
        methods: ["GET", "POST"],
        credentials: false, // Must be false when using wildcard origin
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    });

    // Store global reference for broadcasting from controllers
    setIOInstance(this.io as any);

    // Initialize handlers
    this.chatService = new ChatService();
    this.messageHandler = new MessageHandler(this.io, this.chatService);
    this.presenceHandler = new PresenceHandler(this.io);

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
    this.io.on("connection", async (socket: Socket) => {
      const user = getSocketUser(socket);

      if (!user) {
        console.error("❌ Socket connected without authentication");
        socket.disconnect();
        return;
      }

      console.log(`🔌 Socket connected: ${user.userId} (${socket.id})`);

      // Join user to their personal room for direct messaging
      await socket.join(`user:${user.userId}`);

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
        console.error("Failed to auto-join user chat rooms:", error);
      }

      // Emit authentication success
      socket.emit("authenticated", {
        success: true,
        user: { id: user.userId, email: user.email },
      });

      // Register all event handlers
      this.registerEventHandlers(socket);

      // Handle disconnection
      socket.on("disconnect", async (reason) => {
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
    this.presenceHandler.registerHandlers(socket);

    // Handle generic errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: "An error occurred",
        code: "SOCKET_ERROR",
      });
    });
  }

  /**
   * Setup global event handlers
   */
  private setupEventHandlers(): void {
    this.io.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Log server statistics periodically
    setInterval(() => {
      const connectedSockets = this.io.engine.clientsCount;
      const onlineUsers = this.presenceHandler.getOnlineUserCount();
      const activeRooms = 0; // Chat rooms no longer tracked

      console.log(
        `📊 Socket.IO Stats: ${connectedSockets} sockets, ${onlineUsers} users online, ${activeRooms} active chats`,
      );
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
   * Get presence handler for external access
   */
  getPresenceHandler(): PresenceHandler {
    return this.presenceHandler;
  }

  /**
   * Broadcast message to specific users
   */
  async broadcastToUsers(
    userIds: string[],
    event: keyof SocketEvents,
    data: any,
  ): Promise<void> {
    for (const userId of userIds) {
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      sockets.forEach((socket) => {
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
      activeChats: 0, // Chat rooms no longer tracked
    };
  }

  /**
   * Gracefully close the Socket.IO server
   */
  async close(): Promise<void> {
    console.log("🔌 Closing Socket.IO server...");

    // Set all users offline
    const onlineUsers = this.presenceHandler.getOnlineUsers();
    for (const user of onlineUsers) {
      await this.presenceHandler.broadcastUserStatus(user.userId, false);
    }

    this.io.close();
    console.log("✅ Socket.IO server closed");
  }
}

// Export singleton instance creation function
export const createSocketIOServer = (
  httpServer: HttpServer,
): SocketIOServer => {
  return new SocketIOServer(httpServer);
};

export * from "./types";
export * from "./handlers/message.handler";
export * from "./handlers/presence.handler";
