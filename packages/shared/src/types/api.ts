export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string; // for cursor-based pagination
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client to Server Events
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'message:send': (data: {
    chatId: string;
    content: string;
    messageType?: 'text' | 'image' | 'file';
    replyToId?: string;
  }) => void;
  'message:typing': (data: {
    chatId: string;
    userId: string;
    isTyping: boolean
  }) => void;
  'message:read': (data: {
    messageId: string;
    userId: string
  }) => void;
  'chat:join': (data: { chatId: string }) => void;
  'chat:leave': (data: { chatId: string }) => void;
  'notification:read': (data: { notificationId: string }) => void;
  'notification:mark_all_read': () => void;

  // Server to Client Events
  'user:status': (data: {
    userId: string;
    isOnline: boolean;
    lastSeen?: Date
  }) => void;
  'message:new': (message: any) => void;
  'message:updated': (message: any) => void;
  'message:deleted': (data: {
    messageId: string;
    chatId: string
  }) => void;
  'message:typing:update': (data: {
    chatId: string;
    userId: string;
    userName: string;
    isTyping: boolean
  }) => void;
  'message:read:update': (data: {
    messageId: string;
    userId: string;
    userName: string;
    readAt: Date;
  }) => void;
  'chat:created': (chat: any) => void;
  'chat:updated': (chat: any) => void;
  'chat:user:joined': (data: {
    chatId: string;
    user: any;
  }) => void;
  'chat:user:left': (data: {
    chatId: string;
    userId: string;
  }) => void;
  'notification:new': (notification: any) => void;
  'notification:updated': (notification: any) => void;
  'error': (error: {
    message: string;
    code?: string;
    details?: any;
  }) => void;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}