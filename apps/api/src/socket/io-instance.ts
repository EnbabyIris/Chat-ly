/**
 * Global Socket.IO instance holder
 * Allows non-socket code (controllers, services) to broadcast events
 */
import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIOInstance(io: Server): void {
  ioInstance = io;
}

export function getIOInstance(): Server | null {
  return ioInstance;
}
