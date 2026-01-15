# API Testing Guide

## Prerequisites

1. **Start the API Server**
   ```powershell
   # In the project root
   pnpm --filter api dev
   ```
   The server should be running on `http://localhost:5000`

2. **Verify Server is Running**
   ```powershell
   # Test health endpoint
   Invoke-RestMethod -Uri "http://localhost:5000/health"
   ```

## Running the Test Script

### Option 1: Run All Tests
```powershell
# From project root
.\test-apis.ps1
```

### Option 2: Run Tests Step by Step
You can also test individual endpoints manually:

#### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

#### 2. Register User
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

#### 3. Login
```powershell
$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.accessToken
```

#### 4. Get Current User (Protected)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/me" -Headers $headers
```

#### 5. Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/users" -Headers $headers
```

#### 6. Create Chat
```powershell
$body = @{
    participantIds = @("user-id-here")
    isGroupChat = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/chats" -Method POST -Body $body -ContentType "application/json" -Headers $headers
```

#### 7. Send Message
```powershell
$body = @{
    chatId = "chat-id-here"
    content = "Hello from PowerShell!"
    messageType = "text"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/messages" -Method POST -Body $body -ContentType "application/json" -Headers $headers
```

## Test Script Features

The `test-apis.ps1` script automatically:
- ✅ Tests all API endpoints
- ✅ Handles authentication tokens
- ✅ Creates test data (users, chats, messages)
- ✅ Provides colored output for easy reading
- ✅ Shows test summary at the end

## Expected Output

```
========================================
  Chat-Turbo API Test Suite
========================================

[1] Testing Health Check Endpoints
----------------------------------------
ℹ️  Testing: Health Check
  GET http://localhost:5000/api/v1/health
✅ Health Check - Status: OK

[2] Testing Authentication Endpoints
----------------------------------------
...
```

## Troubleshooting

### Server Not Running
```
❌ Error: Unable to connect to the remote server
```
**Solution**: Start the API server with `pnpm --filter api dev`

### Authentication Errors
```
❌ Status: 401 - Unauthorized
```
**Solution**: Make sure you're using a valid JWT token in the Authorization header

### Database Connection Errors
```
❌ Database connection failed
```
**Solution**: Check your `.env` file and ensure PostgreSQL is running

## API Endpoints Tested

### Authentication
- ✅ POST `/api/v1/auth/register` - Register new user
- ✅ POST `/api/v1/auth/login` - Login user
- ✅ POST `/api/v1/auth/refresh` - Refresh token
- ✅ GET `/api/v1/auth/me` - Get current user
- ✅ POST `/api/v1/auth/logout` - Logout

### Users
- ✅ GET `/api/v1/users` - Get all users
- ✅ GET `/api/v1/users/search` - Search users
- ✅ GET `/api/v1/users/:userId` - Get user by ID
- ✅ PUT `/api/v1/users/profile` - Update profile

### Chats
- ✅ GET `/api/v1/chats` - Get user chats
- ✅ POST `/api/v1/chats` - Create chat
- ✅ GET `/api/v1/chats/:chatId` - Get chat by ID
- ✅ PUT `/api/v1/chats/:chatId` - Update chat
- ✅ DELETE `/api/v1/chats/:chatId` - Delete chat
- ✅ GET `/api/v1/chats/:chatId/messages` - Get chat messages

### Messages
- ✅ POST `/api/v1/messages` - Send message
- ✅ PUT `/api/v1/messages/:messageId` - Update message
- ✅ DELETE `/api/v1/messages/:messageId` - Delete message
- ✅ POST `/api/v1/messages/:messageId/read` - Mark as read
