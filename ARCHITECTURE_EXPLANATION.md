# Chat-Turbo Architecture & Flow - Step-by-Step Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Backend Architecture (API)](#backend-architecture-api)
4. [Frontend Architecture (Web)](#frontend-architecture-web)
5. [Shared Package](#shared-package)
6. [Complete Data Flow](#complete-data-flow)
7. [Real-Time Communication](#real-time-communication)

---

## 🎯 Overview

**Chat-Turbo** is a modern, production-ready chat application built as a **monorepo** using:
- **Turborepo** - Monorepo management
- **Express.js + Socket.IO** - Backend API & real-time
- **Next.js 16** - Frontend framework
- **PostgreSQL + Drizzle ORM** - Database
- **TypeScript** - Type safety across the stack
- **pnpm** - Package manager

---

## 📦 Monorepo Structure

```
chat-turbo/
├── apps/
│   ├── api/          # Backend Express + Socket.IO server
│   └── web/          # Frontend Next.js application
├── packages/
│   ├── shared/       # Shared types, validations, constants
│   ├── ui/           # Shared UI components
│   ├── eslint-config/# Shared ESLint configs
│   └── typescript-config/ # Shared TS configs
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml # Workspace definition
```

**Why Monorepo?**
- Share code between frontend and backend
- Single source of truth for types
- Easier refactoring and consistency
- Unified build and development workflow

---

## 🔧 Backend Architecture (API)

### **Step 1: Server Initialization** (`apps/api/src/server.ts`)

```
1. Server starts → ChatTurboServer class created
2. Validates environment variables (database, JWT secrets, etc.)
3. Creates Express app
4. Creates HTTP server from Express app
5. Attaches Socket.IO to HTTP server
6. Sets up middleware, routes, error handling
7. Tests database connection
8. Starts listening on port (default: 5000)
```

**Key Components:**
- **Express App** - Handles REST API requests
- **HTTP Server** - Base for both Express and Socket.IO
- **Socket.IO Server** - Handles real-time WebSocket connections

---

### **Step 2: Middleware Stack** (`apps/api/src/middleware/`)

**Request Flow Through Middleware:**
```
Incoming Request
    ↓
1. Helmet (Security headers)
    ↓
2. CORS (Cross-origin resource sharing)
    ↓
3. Body Parser (JSON, URL-encoded)
    ↓
4. Rate Limiter (Prevent abuse)
    ↓
5. Request Logger (Development only)
    ↓
6. Route Handler
    ↓
7. Error Handler (If error occurs)
    ↓
Response
```

**Middleware Files:**
- `auth.ts` - JWT token verification
- `validate.ts` - Request validation using Zod
- `rate-limiter.ts` - Rate limiting
- `error-handler.ts` - Global error handling

---

### **Step 3: Routes** (`apps/api/src/routes/`)

**Route Structure:**
```
/api/v1/
├── /auth
│   ├── POST /register    → Create new user
│   ├── POST /login       → Authenticate user
│   ├── POST /refresh     → Refresh JWT token
│   ├── POST /logout      → Logout user
│   └── GET  /me          → Get current user
│
├── /users
│   ├── GET  /            → Get all users
│   ├── GET  /search      → Search users
│   ├── GET  /:userId      → Get user by ID
│   └── PUT  /profile     → Update profile
│
├── /chats
│   ├── GET  /            → Get user's chats
│   ├── POST /            → Create new chat
│   ├── GET  /:chatId     → Get chat details
│   ├── PUT  /:chatId     → Update chat
│   ├── DELETE /:chatId   → Delete chat
│   └── GET  /:chatId/messages → Get chat messages
│
└── /messages
    ├── POST /            → Send message
    ├── PUT  /:messageId  → Edit message
    ├── DELETE /:messageId → Delete message
    └── POST /:messageId/read → Mark as read
```

**Route Flow:**
```
Request → Route → Auth Middleware → Validation → Controller → Service → Database → Response
```

---

### **Step 4: Controllers** (`apps/api/src/controllers/`)

**Controller Pattern:**
```typescript
// Example: auth.controller.ts
1. Receives HTTP request
2. Extracts data from request body/params
3. Calls service layer
4. Returns formatted response
```

**Controller Files:**
- `auth.controller.ts` - Authentication logic
- `user.controller.ts` - User management
- `chat.controller.ts` - Chat operations
- `message.controller.ts` - Message operations

---

### **Step 5: Services** (`apps/api/src/services/`)

**Service Layer (Business Logic):**
```typescript
// Example: auth.service.ts
1. Validates input data
2. Interacts with database
3. Handles password hashing (bcrypt)
4. Generates JWT tokens
5. Returns data to controller
```

**Service Files:**
- `auth.service.ts` - Authentication business logic
- `user.service.ts` - User business logic
- `chat.service.ts` - Chat business logic
- `message.service.ts` - Message business logic

---

### **Step 6: Database** (`apps/api/src/db/`)

**Database Schema** (`schema.ts`):

**Tables:**
1. **users** - User accounts
   - id, name, email, password, avatar, bio
   - isOnline, lastSeen
   
2. **chats** - Chat rooms (1:1 or group)
   - id, name, isGroupChat, groupAdmin
   - avatar, description
   
3. **chat_participants** - Many-to-many (users ↔ chats)
   - chatId, userId, role, joinedAt, leftAt
   
4. **messages** - Messages in chats
   - id, chatId, senderId, content
   - messageType (text/image/file)
   - isEdited, isDeleted, replyToId
   
5. **message_read_receipts** - Read receipts
   - messageId, userId, readAt
   
6. **refresh_tokens** - JWT refresh tokens
   - userId, token, expiresAt, isRevoked
   
7. **typing_indicators** - Real-time typing status
   - chatId, userId, isTyping

**Database Connection** (`db/index.ts`):
- Uses Drizzle ORM
- PostgreSQL database
- Connection pooling
- Type-safe queries

---

### **Step 7: Socket.IO Real-Time** (`apps/api/src/socket/`)

**Socket.IO Architecture:**

```
Client connects → Socket.IO Server
    ↓
Authentication Middleware (JWT verification)
    ↓
Connection Handler
    ↓
Event Handlers:
├── Message Handler (send, receive, edit, delete)
├── Chat Handler (create, join, leave)
├── Typing Handler (typing indicators)
└── Presence Handler (online/offline status)
```

**Socket Handlers:**
- `message.handler.ts` - Real-time messaging
- `chat.handler.ts` - Chat room management
- `typing.handler.ts` - Typing indicators
- `presence.handler.ts` - Online/offline status

**Socket Events:**
- `message:send` - Send message
- `message:received` - Message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:online` - User came online
- `presence:offline` - User went offline

---

## 🎨 Frontend Architecture (Web)

### **Step 1: Next.js App Structure** (`apps/web/app/`)

```
app/
├── layout.tsx        # Root layout (wraps all pages)
├── page.tsx          # Landing page
├── auth/
│   └── page.tsx      # Authentication page
└── chats/
    └── page.tsx      # Main chat interface
```

**Next.js 16 Features:**
- App Router (file-based routing)
- Server Components (default)
- Client Components (`'use client'`)
- React Server Components

---

### **Step 2: Components** (`apps/web/components/`)

**Component Structure:**

```
components/
├── auth/              # Authentication UI
│   ├── login.tsx
│   ├── signup.tsx
│   └── left-section.tsx
│
├── chat/               # Chat interface
│   ├── chat-sidebar.tsx      # Left sidebar (chat list)
│   ├── chat-area.tsx         # Main chat area
│   ├── message-list.tsx      # Messages display
│   ├── message-bubble.tsx    # Individual message
│   └── message-input.tsx     # Message input
│
├── features/           # Feature components
│   ├── message-input.tsx
│   ├── notification-bell.tsx
│   └── user-profile.tsx
│
├── layouts/            # Layout components
│   ├── app-header.tsx
│   └── floating-header.tsx
│
└── ui/                 # Reusable UI components
    ├── button.tsx
    ├── input.tsx
    └── skeleton.tsx
```

---

### **Step 3: Hooks** (`apps/web/hooks/`)

**Custom React Hooks:**

1. **`use-chat-data.ts`**
   - Fetches users, chats, messages
   - Manages current user state
   - Handles online users

2. **`use-chat-actions.ts`**
   - `handleSendMessage` - Send message
   - `handleSendFile` - Upload file
   - `handleStartChat` - Start new chat

3. **`use-chat-filters.ts`**
   - Filters users by search query
   - Filters chats by search query

4. **`useMessageInput.ts`**
   - Manages message input state
   - Handles typing indicators
   - File upload handling

---

### **Step 4: Page Flow** (`apps/web/app/chats/page.tsx`)

**Chat Page Flow:**
```
1. Page loads → useChatData() fetches data
2. User selects chat → setSelectedChat()
3. Messages load for selected chat
4. User types message → useMessageInput()
5. User sends → handleSendMessage()
6. Message sent via API + Socket.IO
7. Real-time update via Socket.IO
8. UI updates automatically
```

---

## 📚 Shared Package

### **Purpose** (`packages/shared/`)

**Shared between Frontend & Backend:**
- Type definitions (TypeScript interfaces)
- Validation schemas (Zod)
- Constants (API endpoints, socket events)

**Structure:**
```
packages/shared/src/
├── types/
│   ├── user.ts        # User type
│   ├── chat.ts        # Chat type
│   ├── message.ts     # Message type
│   └── auth.ts        # Auth types
│
├── validations/
│   ├── auth.ts        # Auth validation schemas
│   ├── chat.ts        # Chat validation
│   └── message.ts     # Message validation
│
└── constants/
    └── index.ts       # Socket events, API endpoints
```

**Why Shared?**
- Type safety across frontend and backend
- Single source of truth
- Prevents type mismatches
- Easier refactoring

---

## 🔄 Complete Data Flow

### **Scenario: User Sends a Message**

#### **Step 1: User Action (Frontend)**
```
User types message → clicks send
    ↓
handleSendMessage() called
    ↓
Message data prepared
```

#### **Step 2: API Request (REST)**
```
POST /api/v1/messages
Headers: { Authorization: "Bearer <JWT>" }
Body: { chatId, content, messageType }
    ↓
Express receives request
    ↓
Auth middleware verifies JWT
    ↓
Validation middleware checks data
    ↓
message.controller.ts → message.service.ts
    ↓
Service saves to database
    ↓
Returns message object
```

#### **Step 3: Real-Time Broadcast (Socket.IO)**
```
Service saves message
    ↓
message.service.ts emits Socket.IO event
    ↓
Socket.IO broadcasts to:
    - All participants in chat room
    - Updates typing indicators
    - Updates presence status
    ↓
Frontend receives Socket.IO event
    ↓
UI updates automatically
```

#### **Step 4: Frontend Update**
```
Socket.IO event received
    ↓
useChatData() hook updates state
    ↓
React re-renders components
    ↓
New message appears in chat
```

---

### **Scenario: User Authentication**

#### **Step 1: User Registers**
```
Frontend: User fills signup form
    ↓
POST /api/v1/auth/register
    ↓
auth.controller.ts → auth.service.ts
    ↓
Service:
  1. Validates email uniqueness
  2. Hashes password (bcrypt)
  3. Creates user in database
  4. Generates JWT tokens (access + refresh)
    ↓
Returns tokens to frontend
    ↓
Frontend stores tokens (localStorage/cookies)
```

#### **Step 2: User Logs In**
```
Frontend: User fills login form
    ↓
POST /api/v1/auth/login
    ↓
auth.service.ts:
  1. Finds user by email
  2. Verifies password (bcrypt.compare)
  3. Generates JWT tokens
  4. Saves refresh token to database
    ↓
Returns tokens
    ↓
Frontend stores tokens
```

#### **Step 3: Authenticated Requests**
```
Every API request includes:
  Authorization: Bearer <access_token>
    ↓
auth middleware verifies token
    ↓
Extracts user ID from token
    ↓
Attaches user to request object
    ↓
Controller can access req.user
```

---

### **Scenario: Real-Time Chat**

#### **Step 1: Socket Connection**
```
Frontend connects to Socket.IO
    ↓
Sends JWT token in connection
    ↓
socket/auth.middleware.ts verifies token
    ↓
Socket authenticated
    ↓
User joins their personal room: `user:${userId}`
```

#### **Step 2: Join Chat Room**
```
User selects a chat
    ↓
Frontend emits: socket.emit('chat:join', { chatId })
    ↓
chat.handler.ts receives event
    ↓
Socket joins room: `chat:${chatId}`
    ↓
Server broadcasts: "User joined chat"
```

#### **Step 3: Send Message (Real-Time)**
```
User sends message
    ↓
Frontend emits: socket.emit('message:send', { chatId, content })
    ↓
message.handler.ts receives event
    ↓
Handler:
  1. Validates message
  2. Saves to database
  3. Broadcasts to chat room
    ↓
All participants in room receive message
    ↓
Frontend updates UI
```

#### **Step 4: Typing Indicators**
```
User starts typing
    ↓
Frontend emits: socket.emit('typing:start', { chatId })
    ↓
typing.handler.ts receives event
    ↓
Broadcasts to chat room (except sender)
    ↓
Other users see "User is typing..."
    ↓
User stops typing (after 3s)
    ↓
Frontend emits: socket.emit('typing:stop', { chatId })
```

---

## 🚀 Development Workflow

### **Starting the Application**

```bash
# Install dependencies
pnpm install

# Start all apps (API + Web)
pnpm dev

# Or start individually:
pnpm --filter api dev    # Backend on :5000
pnpm --filter web dev    # Frontend on :3002
```

### **Build Process**

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter api build
pnpm --filter web build
```

### **Database Migrations**

```bash
# Generate migration
pnpm --filter api db:generate

# Run migration
pnpm --filter api db:migrate

# Open Drizzle Studio (DB GUI)
pnpm --filter api db:studio
```

---

## 🔐 Security Features

1. **JWT Authentication**
   - Access tokens (short-lived)
   - Refresh tokens (long-lived, stored in DB)
   - Token rotation on refresh

2. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Never stored in plain text

3. **Rate Limiting**
   - Prevents API abuse
   - Configurable per endpoint

4. **CORS Protection**
   - Only allows frontend origin
   - Credentials enabled

5. **Helmet Security**
   - Security headers
   - XSS protection
   - Content Security Policy

---

## 📊 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Monorepo** | Turborepo | Build orchestration |
| **Backend** | Express.js | REST API |
| **Real-Time** | Socket.IO | WebSocket communication |
| **Database** | PostgreSQL + Drizzle | Data persistence |
| **Frontend** | Next.js 16 | React framework |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Types** | TypeScript | Type safety |
| **Validation** | Zod | Runtime validation |
| **Auth** | JWT + bcrypt | Authentication |

---

## 🎯 Summary

**Chat-Turbo** follows a **clean architecture** pattern:

1. **Separation of Concerns**
   - Controllers handle HTTP
   - Services handle business logic
   - Database handles persistence

2. **Type Safety**
   - Shared types between frontend/backend
   - TypeScript everywhere
   - Zod validation

3. **Real-Time Communication**
   - REST API for CRUD operations
   - Socket.IO for real-time events

4. **Scalability**
   - Modular structure
   - Easy to add features
   - Production-ready patterns

5. **Developer Experience**
   - Monorepo for code sharing
   - Hot reload in development
   - Type-safe across stack

---

This architecture ensures **maintainability**, **scalability**, and **type safety** throughout the application! 🚀
