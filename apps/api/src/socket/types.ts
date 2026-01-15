import type { Socket } from 'socket.io';

// Extend Socket interface with authenticated user info
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Socket event types
export interface SocketEvents {
  // Client to Server events
  'user:online': () => void;
  'user:offline': () => void;
  'chat:join': (data: { chatId: string }) => void;
  'chat:leave': (data: { chatId: string }) => void;
  'message:send': (data: SendMessageData) => void;
  'message:typing': (data: TypingData) => void;
  'message:read': (data: ReadMessageData) => void;

  // Server to Client events
  'user:status': (data: UserStatusData) => void;
  'message:new': (data: MessageData) => void;
  'message:updated': (data: MessageData) => void;
  'message:deleted': (data: { messageId: string; chatId: string }) => void;
  'message:typing:update': (data: TypingUpdateData) => void;
  'chat:user:joined': (data: ChatUserData) => void;
  'chat:user:left': (data: ChatUserData) => void;
  'error': (data: ErrorData) => void;
  'authenticated': (data: { success: boolean; user?: UserData }) => void;
}

// Data interfaces for socket events
export interface SendMessageData {
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  replyToId?: string;
}

export interface MessageData {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  replyToId?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingData {
  chatId: string;
  isTyping: boolean;
}

export interface TypingUpdateData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
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

export interface ChatUserData {
  chatId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
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

// Room management types
export interface ChatRoom {
  chatId: string;
  participants: Set<string>; // user IDs
  typingUsers: Map<string, { userName: string; timestamp: Date }>;
}

// Online users tracking
export interface OnlineUser {
  userId: string;
  socketId: string;
  userName: string;
  joinedAt: Date;
}