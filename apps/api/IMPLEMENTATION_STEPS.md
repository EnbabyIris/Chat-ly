# Complete Backend Implementation Steps

This document contains all the code implementation for building the Chat-Turbo backend.

## Current Status

### ✅ COMPLETED:
- Step 1: Database Connection & Schema
- Step 2: Shared Types & Validations
- Step 3: Utilities (JWT, Password, Errors, Response)
- Step 4: Middleware (Auth, Validation, Error Handler, Rate Limiter)
- Step 5: Services (Auth, User, Chat, Message)

### 🔄 NEXT STEPS:
- Step 6: Controllers (API route handlers)
- Step 7: Routes (Express route definitions)
- Step 8: Socket.IO (Real-time messaging)
- Step 9: Server Setup (Main application entry point)

Continue to IMPLEMENTATION_STEPS_PART2.md for Steps 6-9 implementation code.

---

## Table of Contents

- [Step 1: Database Connection](#step-1-database-connection)
- [Step 2: Shared Types & Validations](#step-2-shared-types--validations)
- [Step 3: Utilities](#step-3-utilities)
- [Step 4: Middleware](#step-4-middleware)
- [Step 5: Services](#step-5-services)
- [Step 6: Controllers](#step-6-controllers)
- [Step 7: Routes](#step-7-routes)
- [Step 8: Socket.IO](#step-8-socketio)
- [Step 9: Server Setup](#step-9-server-setup)

---

## Step 1: Database Connection

**File: `apps/api/src/db/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// For migrations
export const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// For queries
const queryClient = postgres(process.env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });

// Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await queryClient`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export * from './schema';
```

---

## Step 2: Shared Types & Validations

### A. Update Shared Types

**File: `packages/shared/src/types/index.ts`**

```typescript
export * from './user';
export * from './chat';
export * from './message';
export * from './auth';
export * from './api';
```

**File: `packages/shared/src/types/user.ts`**

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
}
```

**File: `packages/shared/src/types/chat.ts`**

```typescript
import { UserListItem } from './user';
import { Message } from './message';

export interface Chat {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  groupAdmin: string | null;
  avatar: string | null;
  participants: ChatParticipant[];
  latestMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  leftAt: Date | null;
  user?: UserListItem;
}

export interface ChatListItem {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  avatar: string | null;
  participants: UserListItem[];
  latestMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface CreateChatDTO {
  participantIds: string[];
  isGroupChat?: boolean;
  name?: string;
  avatar?: string;
}

export interface UpdateChatDTO {
  name?: string;
  avatar?: string;
}

export type ActiveTab = 'chats' | 'users';
```

**File: `packages/shared/src/types/message.ts`**

```typescript
export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  readReceipts?: MessageReadReceipt[];
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface SendMessageDTO {
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface UpdateMessageDTO {
  content: string;
}
```

**File: `packages/shared/src/types/auth.ts`**

```typescript
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

**File: `packages/shared/src/types/api.ts`**

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
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
  };
}

export interface SocketEvents {
  // Client to Server
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'message:send': (message: any) => void;
  'message:typing': (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  'message:read': (data: { messageId: string; userId: string }) => void;
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;

  // Server to Client
  'user:status': (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => void;
  'message:new': (message: any) => void;
  'message:updated': (message: any) => void;
  'message:deleted': (messageId: string) => void;
  'message:typing:update': (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => void;
  'chat:created': (chat: any) => void;
  'chat:updated': (chat: any) => void;
  'error': (error: { message: string; code?: string }) => void;
}
```

### B. Create Zod Validations

**File: `packages/shared/src/validations/index.ts`**

```typescript
export * from './auth';
export * from './chat';
export * from './message';
export * from './user';
```

**File: `packages/shared/src/validations/auth.ts`**

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
```

**File: `packages/shared/src/validations/chat.ts`**

```typescript
import { z } from 'zod';

export const createChatSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1, 'At least one participant required'),
  isGroupChat: z.boolean().optional().default(false),
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const updateChatSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const chatIdParamSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type ChatIdParam = z.infer<typeof chatIdParamSchema>;
```

**File: `packages/shared/src/validations/message.ts`**

```typescript
import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  messageType: z.enum(['text', 'image', 'file', 'system']).optional().default('text'),
  attachmentUrl: z.string().url().optional().nullable(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export const messageIdParamSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});

export const getChatMessagesSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  before: z.string().uuid().optional(), // cursor-based pagination
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type MessageIdParam = z.infer<typeof messageIdParamSchema>;
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;
```

**File: `packages/shared/src/validations/user.ts`**

```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
```

### C. Constants

**File: `packages/shared/src/constants/index.ts`**

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  USERS: {
    SEARCH: '/api/users/search',
    PROFILE: (userId: string) => `/api/users/${userId}`,
    UPDATE_PROFILE: '/api/users/profile',
  },
  CHATS: {
    LIST: '/api/chats',
    CREATE: '/api/chats',
    GET: (chatId: string) => `/api/chats/${chatId}`,
    UPDATE: (chatId: string) => `/api/chats/${chatId}`,
    DELETE: (chatId: string) => `/api/chats/${chatId}`,
  },
  MESSAGES: {
    LIST: (chatId: string) => `/api/chats/${chatId}/messages`,
    SEND: '/api/messages',
    UPDATE: (messageId: string) => `/api/messages/${messageId}`,
    DELETE: (messageId: string) => `/api/messages/${messageId}`,
    READ: (messageId: string) => `/api/messages/${messageId}/read`,
  },
} as const;

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User status
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS: 'user:status',
  
  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  
  // Typing indicators
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_TYPING_UPDATE: 'message:typing:update',
  
  // Chats
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_CREATED: 'chat:created',
  CHAT_UPDATED: 'chat:updated',
  
  // Errors
  ERROR: 'error',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // Users
  USER_NOT_FOUND: 'User not found',
  
  // Chats
  CHAT_NOT_FOUND: 'Chat not found',
  NOT_CHAT_PARTICIPANT: 'You are not a participant of this chat',
  CANNOT_MESSAGE_YOURSELF: 'Cannot create chat with yourself',
  
  // Messages
  MESSAGE_NOT_FOUND: 'Message not found',
  CANNOT_EDIT_MESSAGE: 'Cannot edit this message',
  CANNOT_DELETE_MESSAGE: 'Cannot delete this message',
  
  // General
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
} as const;
```

**File: `packages/shared/src/index.ts`**

```typescript
export * from './types';
export * from './validations';
export * from './constants';
```

---

## Step 3: Utilities

**File: `apps/api/src/utils/index.ts`**

```typescript
export * from './jwt';
export * from './password';
export * from './errors';
export * from './response';
```

**File: `apps/api/src/utils/jwt.ts`**

```typescript
import jwt from 'jsonwebtoken';
import { TokenPayload } from '@repo/shared/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const getTokenExpiration = (expiresIn: string): Date => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    throw new Error('Invalid expiration format');
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid time unit');
  }
};
```

**File: `apps/api/src/utils/password.ts`**

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

**File: `apps/api/src/utils/errors.ts`**

```typescript
import { HTTP_STATUS } from '@repo/shared/constants';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.BAD_REQUEST, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(HTTP_STATUS.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(HTTP_STATUS.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.CONFLICT, message);
  }
}
```

**File: `apps/api/src/utils/response.ts`**

```typescript
import { Response } from 'express';
import { ApiResponse } from '@repo/shared/types';
import { HTTP_STATUS } from '@repo/shared/constants';

export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = HTTP_STATUS.OK,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  error: string,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message?: string,
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    message,
  };
  return res.status(statusCode).json(response);
};
```

---

**Continue to Part 2 for Middleware, Services, Controllers, Routes, Socket.IO, and Server Setup...**
