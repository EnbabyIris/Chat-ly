// API Endpoints
// Note: These endpoints are relative paths that will be prefixed with /api/v1 in the client
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    SEARCH: '/users/search',
    PROFILE: (userId: string) => `/users/${userId}`,
    UPDATE_PROFILE: '/users/profile',
    ALL: '/users',
    ONLINE: '/users/online',
  },
  CHATS: {
    LIST: '/chats',
    CREATE: '/chats',
    GET: (chatId: string) => `/chats/${chatId}`,
    UPDATE: (chatId: string) => `/chats/${chatId}`,
    DELETE: (chatId: string) => `/chats/${chatId}`,
    MESSAGES: (chatId: string) => `/chats/${chatId}/messages`,
  },
  MESSAGES: {
    SEND: '/messages',
    UPDATE: (messageId: string) => `/messages/${messageId}`,
    DELETE: (messageId: string) => `/messages/${messageId}`,
    READ: (messageId: string) => `/messages/${messageId}/read`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
} as const;

// Socket.IO Events
export const SOCKET_EVENTS = {
  // Connection Events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // User Status Events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS: 'user:status',
  
  // Message Events
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  MESSAGE_READ_UPDATE: 'message:read:update',

  // Notification Events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_MARK_ALL_READ: 'notification:mark_all_read',

  // Typing Events
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_TYPING_UPDATE: 'message:typing:update',
  
  // Chat Events
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_CREATED: 'chat:created',
  CHAT_UPDATED: 'chat:updated',
  CHAT_USER_JOINED: 'chat:user:joined',
  CHAT_USER_LEFT: 'chat:user:left',
  
  // Error Events
  ERROR: 'error',
  VALIDATION_ERROR: 'validation:error',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
  
  // User Errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_USER_DATA: 'Invalid user data provided',
  
  // Chat Errors
  CHAT_NOT_FOUND: 'Chat not found',
  NOT_CHAT_PARTICIPANT: 'You are not a participant of this chat',
  CANNOT_MESSAGE_YOURSELF: 'Cannot create chat with yourself',
  CHAT_NAME_REQUIRED: 'Group chats must have a name',
  MAX_PARTICIPANTS_EXCEEDED: 'Maximum number of participants exceeded',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
  
  // Message Errors
  MESSAGE_NOT_FOUND: 'Message not found',
  CANNOT_EDIT_MESSAGE: 'Cannot edit this message',
  CANNOT_DELETE_MESSAGE: 'Cannot delete this message',
  MESSAGE_TOO_LONG: 'Message exceeds maximum length',
  EMPTY_MESSAGE: 'Message cannot be empty',
  ATTACHMENT_REQUIRED: 'Attachment is required for this message type',
  INVALID_ATTACHMENT: 'Invalid attachment format',
  
  // General Errors
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timeout',
  DATABASE_ERROR: 'Database operation failed',
  FILE_UPLOAD_ERROR: 'File upload failed',
  
  // Socket Errors
  SOCKET_CONNECTION_FAILED: 'Failed to establish socket connection',
  SOCKET_AUTHENTICATION_FAILED: 'Socket authentication failed',
  SOCKET_ROOM_JOIN_FAILED: 'Failed to join chat room',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  
  // User
  PROFILE_UPDATED: 'Profile updated successfully',
  USER_STATUS_UPDATED: 'User status updated',
  
  // Chat
  CHAT_CREATED: 'Chat created successfully',
  CHAT_UPDATED: 'Chat updated successfully',
  CHAT_DELETED: 'Chat deleted successfully',
  USER_ADDED_TO_CHAT: 'User added to chat',
  USER_REMOVED_FROM_CHAT: 'User removed from chat',
  
  // Message
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_UPDATED: 'Message updated successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
  MESSAGE_READ: 'Message marked as read',
} as const;

// Application Constants
export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Message Limits
  MAX_MESSAGE_LENGTH: 5000,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Chat Limits
  MAX_CHAT_NAME_LENGTH: 255,
  MAX_CHAT_DESCRIPTION_LENGTH: 1000,
  MAX_PARTICIPANTS_PER_CHAT: 100,
  
  // User Limits
  MAX_USER_NAME_LENGTH: 100,
  MAX_USER_BIO_LENGTH: 500,
  
  // File Types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  
  // Timeouts
  TYPING_TIMEOUT: 3000, // 3 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  REQUEST_TIMEOUT: 30000, // 30 seconds
} as const;