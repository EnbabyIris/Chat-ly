/**
 * Socket.IO Client
 *
 * Manages Socket.IO connection with authentication and event handling.
 */

import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "../api/client";
import { SOCKET_EVENTS } from "../shared/constants";
import type { SocketEvents } from "../shared/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

class SocketClient {
  private socket: Socket<SocketEvents> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to Socket.IO server with JWT authentication
   */
  connect(): Socket<SocketEvents> | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      console.warn("No access token available for Socket.IO connection");
      return null;
    }

    this.isConnecting = true;

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: accessToken,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error("Failed to create Socket.IO connection:", error);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("🔌 Socket.IO connected:", this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
      this.isConnecting = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 Socket.IO connection error:", error);
      this.isConnecting = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    (this.socket as any).on("authenticated", (data: any) => {
      console.log("✅ Socket.IO authenticated:", data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket<SocketEvents> | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Reconnect with new token (after token refresh)
   */
  reconnectWithNewToken(): void {
    this.disconnect();
    this.connect();
  }
}

// Singleton instance
export const socketClient = new SocketClient();
