import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { UserService } from '../services/user.service';
import type { AuthenticatedSocket } from './types';

const userService = new UserService();

/**
 * Socket.IO authentication middleware
 * Validates JWT token and attaches user info to socket
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    // Extract token from handshake auth or query
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error('Authentication required: No token provided'));
    }

    // Verify JWT token
    const payload = verifyAccessToken(token);
    
    if (!payload || !payload.userId) {
      return next(new Error('Invalid token: Missing user information'));
    }

    // Verify user exists and is active
    const user = await userService.getUserById(payload.userId);
    
    if (!user) {
      return next(new Error('User not found or inactive'));
    }

    // Attach user info to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = user.id;
    authSocket.email = user.email;

    // Update user online status
    await userService.updateUserStatus(user.id, true);

    console.log(`🔌 Socket authenticated: ${user.name} (${user.id})`);
    
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error);
    next(new Error(`Authentication failed: ${(error as Error).message}`));
  }
};

/**
 * Helper to get authenticated user info from socket
 */
export const getSocketUser = (socket: Socket): { userId: string; email: string } | null => {
  const authSocket = socket as AuthenticatedSocket;
  
  if (!authSocket.userId || !authSocket.email) {
    return null;
  }

  return {
    userId: authSocket.userId,
    email: authSocket.email,
  };
};