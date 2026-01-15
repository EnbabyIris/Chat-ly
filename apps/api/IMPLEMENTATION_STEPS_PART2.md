# Implementation Steps - Part 2

Continuation of backend implementation from IMPLEMENTATION_STEPS.md

## Implementation Status

### ✅ FOUNDATION COMPLETE:
- Database schema & connection
- Shared types, validations, constants
- JWT utilities & password hashing
- Error handling & response helpers
- Authentication, validation, rate limiting middleware
- Auth, User, Chat, Message service classes

### 🔄 CURRENT PHASE - Steps 6-9:
- Step 6: Controllers (API route handlers)
- Step 7: Routes (Express route definitions)
- Step 8: Socket.IO (Real-time messaging system)
- Step 9: Server Setup (Main application entry point)

This file contains the implementation code for Steps 4-9 (with Steps 4-5 already completed).

---

## Step 4: Middleware

**File: `apps/api/src/middleware/index.ts`**

```typescript
export * from './auth';
export * from './validate';
export * from './error-handler';
export * from './rate-limiter';
```

**File: `apps/api/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    errorResponse(res, 'Authentication failed', 401, (error as Error).message);
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};
```

**File: `apps/api/src/middleware/validate.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS } from '@repo/shared/constants';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        errorResponse(
          res,
          'Validation failed',
          HTTP_STATUS.BAD_REQUEST,
          JSON.stringify(errorMessages),
        );
      } else {
        next(error);
      }
    }
  };
};
```

**File: `apps/api/src/middleware/error-handler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS } from '@repo/shared/constants';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  errorResponse(
    res,
    'Internal server error',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? err.message : undefined,
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
};
```

**File: `apps/api/src/middleware/rate-limiter.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
}) => {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
      });
      return;
    }

    next();
  };
};

// Clean up expired entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 3600000);
```

---

## Step 5: Services

**File: `apps/api/src/services/index.ts`**

```typescript
export * from './auth.service';
export * from './user.service';
export * from './chat.service';
export * from './message.service';
```

**File: `apps/api/src/services/auth.service.ts`**

```typescript
import { db, users, refreshTokens } from '../db';
import { eq, and } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, getTokenExpiration, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { RegisterDTO, LoginDTO, AuthResponse } from '@repo/shared/types';

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
    });

    const refreshTokenValue = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: newUser.id,
      token: refreshTokenValue,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.userId, payload.userId),
      ),
    });

    if (!storedToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return { accessToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.token, refreshToken)));
  }

  async getCurrentUser(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}
```

**File: `apps/api/src/services/user.service.ts`**

```typescript
import { db, users } from '../db';
import { eq, ilike, or, ne } from 'drizzle-orm';
import { NotFoundError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { UpdateProfileInput, UserListItem } from '@repo/shared/types';

export class UserService {
  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async searchUsers(query: string, currentUserId: string, limit = 20): Promise<UserListItem[]> {
    const results = await db.query.users.findMany({
      where: and(
        or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)),
        ne(users.id, currentUserId),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      limit,
    });

    return results;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async updateUserStatus(userId: string, isOnline: boolean) {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: isOnline ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(excludeUserId?: string): Promise<UserListItem[]> {
    const results = await db.query.users.findMany({
      where: excludeUserId ? ne(users.id, excludeUserId) : undefined,
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return results;
  }
}
```

**File: `apps/api/src/services/chat.service.ts`**

```typescript
import { db, chats, chatParticipants, messages, users } from '../db';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { CreateChatDTO, UpdateChatDTO, ChatListItem } from '@repo/shared/types';

export class ChatService {
  async createChat(userId: string, data: CreateChatDTO) {
    // Validate: can't chat with yourself
    if (data.participantIds.includes(userId)) {
      throw new ValidationError(ERROR_MESSAGES.CANNOT_MESSAGE_YOURSELF);
    }

    // Check if 1:1 chat already exists
    if (!data.isGroupChat && data.participantIds.length === 1) {
      const existingChat = await this.findExistingOneToOneChat(userId, data.participantIds[0]);
      if (existingChat) {
        return existingChat;
      }
    }

    // Create chat
    const [newChat] = await db
      .insert(chats)
      .values({
        name: data.name,
        isGroupChat: data.isGroupChat || false,
        groupAdmin: data.isGroupChat ? userId : null,
        avatar: data.avatar,
      })
      .returning();

    // Add participants (including creator)
    const allParticipants = [userId, ...data.participantIds];
    await db.insert(chatParticipants).values(
      allParticipants.map((participantId, index) => ({
        chatId: newChat.id,
        userId: participantId,
        role: index === 0 && data.isGroupChat ? 'admin' : 'member',
      })),
    );

    // Fetch and return complete chat
    return this.getChatById(newChat.id, userId);
  }

  async findExistingOneToOneChat(user1Id: string, user2Id: string) {
    const chat = await db.query.chats.findFirst({
      where: eq(chats.isGroupChat, false),
      with: {
        participants: {
          where: inArray(
            chatParticipants.userId,
            [user1Id, user2Id],
          ),
        },
      },
    });

    if (chat && chat.participants.length === 2) {
      return this.getChatById(chat.id, user1Id);
    }

    return null;
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
      with: {
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: desc(messages.createdAt),
          limit: 1,
          with: {
            sender: {
              columns: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.userId === userId && !p.leftAt);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    return chat;
  }

  async getUserChats(userId: string): Promise<ChatListItem[]> {
    const userChats = await db.query.chatParticipants.findMany({
      where: and(eq(chatParticipants.userId, userId), eq(chatParticipants.leftAt, null)),
      with: {
        chat: {
          with: {
            participants: {
              where: eq(chatParticipants.leftAt, null),
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              orderBy: desc(messages.createdAt),
              limit: 1,
              with: {
                sender: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: desc(chatParticipants.joinedAt),
    });

    return userChats.map((uc) => ({
      id: uc.chat.id,
      name: uc.chat.name,
      isGroupChat: uc.chat.isGroupChat,
      avatar: uc.chat.avatar,
      participants: uc.chat.participants.map((p) => p.user),
      latestMessage: uc.chat.messages[0]
        ? {
            content: uc.chat.messages[0].content,
            senderId: uc.chat.messages[0].senderId!,
            senderName: uc.chat.messages[0].sender!.name,
            createdAt: uc.chat.messages[0].createdAt,
          }
        : undefined,
      unreadCount: 0, // TODO: Implement unread count
      updatedAt: uc.chat.updatedAt,
    }));
  }

  async updateChat(chatId: string, userId: string, data: UpdateChatDTO) {
    // Verify user is admin
    const participant = await db.query.chatParticipants.findFirst({
      where: and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, userId)),
    });

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can update chat settings');
    }

    const [updatedChat] = await db
      .update(chats)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning();

    return updatedChat;
  }

  async deleteChat(chatId: string, userId: string) {
    // Verify user is admin
    const participant = await db.query.chatParticipants.findFirst({
      where: and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, userId)),
    });

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete chat');
    }

    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async isUserParticipant(chatId: string, userId: string): Promise<boolean> {
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        eq(chatParticipants.leftAt, null),
      ),
    });

    return !!participant;
  }
}
```

**File: `apps/api/src/services/message.service.ts`**

```typescript
import { db, messages, messageReadReceipts } from '../db';
import { eq, and, desc, lt } from 'drizzle-orm';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import { ChatService } from './chat.service';
import type { SendMessageDTO, UpdateMessageDTO } from '@repo/shared/types';

const chatService = new ChatService();

export class MessageService {
  async sendMessage(userId: string, data: SendMessageDTO) {
    // Verify user is participant
    const isParticipant = await chatService.isUserParticipant(data.chatId, userId);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        messageType: data.messageType || 'text',
        attachmentUrl: data.attachmentUrl,
      })
      .returning();

    // Fetch message with sender info
    return this.getMessageById(newMessage.id);
  }

  async getMessageById(messageId: string) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readReceipts: true,
      },
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    return message;
  }

  async getChatMessages(chatId: string, userId: string, limit = 50, before?: string) {
    // Verify user is participant
    const isParticipant = await chatService.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    const conditions = [eq(messages.chatId, chatId), eq(messages.isDeleted, false)];

    if (before) {
      conditions.push(lt(messages.createdAt, new Date(before)));
    }

    const chatMessages = await db.query.messages.findMany({
      where: and(...conditions),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readReceipts: true,
      },
      orderBy: desc(messages.createdAt),
      limit,
    });

    return chatMessages.reverse(); // Return in chronological order
  }

  async updateMessage(messageId: string, userId: string, data: UpdateMessageDTO) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.CANNOT_EDIT_MESSAGE);
    }

    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: data.content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return this.getMessageById(updatedMessage.id);
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      throw new NotFoundError(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.CANNOT_DELETE_MESSAGE);
    }

    await db
      .update(messages)
      .set({
        isDeleted: true,
        content: 'This message has been deleted',
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  async markMessageAsRead(messageId: string, userId: string) {
    // Check if already read
    const existing = await db.query.messageReadReceipts.findFirst({
      where: and(
        eq(messageReadReceipts.messageId, messageId),
        eq(messageReadReceipts.userId, userId),
      ),
    });

    if (existing) {
      return;
    }

    await db.insert(messageReadReceipts).values({
      messageId,
      userId,
    });
  }
}
```

---

**Continue to IMPLEMENTATION_STEPS_PART3.md for Controllers, Routes, Socket.IO, and Server Setup...**
