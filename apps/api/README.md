# Chat-Turbo API

The backend API for Chat-Turbo, built with Express.js, Socket.IO, and TypeScript. Provides RESTful endpoints and real-time WebSocket connections for chat functionality.

## 🚀 Features

- **RESTful API**: Well-structured REST endpoints with proper HTTP status codes
- **Real-time Communication**: Socket.IO for instant messaging
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Validation**: Zod schemas for input validation
- **Security**: Rate limiting, CORS, helmet security headers
- **Documentation**: OpenAPI/Swagger documentation

## 🏗️ Architecture

```
apps/api/
├── src/
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic layer
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route definitions
│   ├── socket/             # WebSocket handlers
│   ├── db/                 # Database schema and connections
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── server.ts           # Main server file
├── drizzle/                # Database migrations
└── tests/                  # Test files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x
- PostgreSQL 15+
- pnpm

### Installation

1. **Install dependencies**
   ```bash
   cd apps/api
   pnpm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/login`
Authenticate user and return tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as register endpoint

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

#### POST `/api/auth/logout`
Invalidate refresh token (logout).

**Headers:**
```
Authorization: Bearer <access_token>
```

### Chat Endpoints

#### GET `/api/chats`
Get user's chat conversations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of chats to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "chats": [
    {
      "id": "chat-uuid",
      "name": "Chat Name",
      "type": "direct|group",
      "lastMessage": {
        "content": "Hello!",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      "participants": [...],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST `/api/chats`
Create a new chat conversation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "My Chat",
  "type": "group",
  "participantIds": ["user-uuid-1", "user-uuid-2"]
}
```

#### GET `/api/chats/:chatId/messages`
Get messages for a specific chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `before` (optional): Cursor for pagination (message ID)

**Response:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "content": "Hello world!",
      "senderId": "user-uuid",
      "chatId": "chat-uuid",
      "type": "text",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "hasMore": false
}
```

#### POST `/api/chats/:chatId/messages`
Send a message to a chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "type": "text"
}
```

### User Endpoints

#### GET `/api/users/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### PUT `/api/users/me`
Update current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

#### GET `/api/users/search`
Search for users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q`: Search query (name or email)
- `limit` (optional): Max results (default: 10)

## 🔌 WebSocket Events

### Connection
```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:8000', {
  auth: {
    token: 'your-access-token'
  }
})
```

### Chat Events

#### Join Chat
```javascript
socket.emit('join-chat', { chatId: 'chat-uuid' })
```

#### Send Message
```javascript
socket.emit('send-message', {
  chatId: 'chat-uuid',
  content: 'Hello!',
  type: 'text'
})
```

#### Receive Message
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message)
})
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing-start', { chatId: 'chat-uuid' })

// Stop typing
socket.emit('typing-stop', { chatId: 'chat-uuid' })

// Listen for typing events
socket.on('user-typing', (data) => {
  console.log(`${data.userName} is typing in ${data.chatId}`)
})
```

#### Online Status
```javascript
// Listen for user status changes
socket.on('user-online', (userId) => {
  console.log(`User ${userId} came online`)
})

socket.on('user-offline', (userId) => {
  console.log(`User ${userId} went offline`)
})
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test -- --testPathPattern=integration
```

### API Tests
```bash
pnpm test -- --testPathPattern=api
```

## 📊 Monitoring

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Metrics
```
GET /api/metrics
```

Returns application metrics in Prometheus format.

## 🔒 Security

### Authentication
- JWT tokens with RS256 algorithm
- Refresh token rotation
- Secure token storage

### Rate Limiting
- API endpoints protected with rate limits
- Configurable limits per endpoint
- Automatic cleanup of expired entries

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization

## 📋 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## 🚀 Deployment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-production-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=8000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Production Checklist
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Rate limiting configured
- [ ] Monitoring and logging enabled
- [ ] CORS properly configured

## 📚 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:generate  # Generate database schema
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
pnpm test         # Run tests
```

### Database Schema
The API uses Drizzle ORM with PostgreSQL. Schema definitions are in `src/db/schema.ts`.

### Adding New Endpoints
1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Update types in `packages/shared/`
4. Add validation schemas
5. Write tests
6. Update documentation

## 🤝 Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.