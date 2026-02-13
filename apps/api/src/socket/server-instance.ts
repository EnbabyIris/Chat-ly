/**
 * Registry for the SocketIOServer instance.
 * This avoids circular dependency issues between server.ts and controllers
 * that need access to the socket server (e.g., for presence data).
 */
import type { SocketIOServer } from './index';

let socketServerInstance: SocketIOServer | null = null;

export function setSocketServer(server: SocketIOServer): void {
  socketServerInstance = server;
}

export function getSocketServerInstance(): SocketIOServer | null {
  return socketServerInstance;
}
