import type { Socket } from 'socket.io';

// Extend Socket interface with authenticated user info
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  userName?: string;
  userAvatar?: string | null;
}

// Socket event types
export interface SocketEvents {
  // Client to Server events
  'user:online': () => void;
  'user:offline': () => void;
  'message:send': (data: SendMessageData) => void;
  'message:read': (data: ReadMessageData) => void;

  // Server to Client events
  'user:status': (data: UserStatusData) => void;
  'message:new': (data: MessageData) => void;
  'message:updated': (data: MessageData) => void;
  'message:deleted': (data: { messageId: string; chatId: string }) => void;
  'error': (data: ErrorData) => void;
  'authenticated': (data: { success: boolean; user?: UserData }) => void;
}

// Data interfaces for socket events
export interface SendMessageData {
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'location';
  attachmentUrl?: string;
  // Location-specific fields
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  replyToId?: string;
}

export interface MessageData {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'system';
  attachmentUrl?: string;
  // Location-specific fields
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  replyToId?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface ReadMessageData {
  messageId: string;
  chatId: string;
}

export interface UserStatusData {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}


export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ErrorData {
  message: string;
  code?: string;
  details?: any;
}


// Online users tracking
export interface OnlineUser {
  userId: string;
  socketId: string;
  userName: string;
  joinedAt: Date;
}