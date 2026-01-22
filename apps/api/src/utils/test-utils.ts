import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { MessageService } from '../services/message.service'

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: '$2a$10$hashedpassword', // bcrypt hash
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

export const createMockMessage = (overrides = {}) => ({
  id: 'msg-1',
  content: 'Hello world!',
  senderId: 'user-1',
  chatId: 'chat-1',
  type: 'text' as const,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides,
})

export const createMockChat = (overrides = {}) => ({
  id: 'chat-1',
  name: 'Test Chat',
  type: 'direct' as const,
  participants: [createMockUser()],
  lastMessage: createMockMessage(),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

export const createMockRefreshToken = (overrides = {}) => ({
  id: 'token-1',
  userId: 'user-1',
  token: 'refresh-token-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

// Mock Express objects
export const createMockRequest = (overrides = {}): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/',
  ...overrides,
})

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  res.get = jest.fn()
  return res
}

export const createMockNext = () => jest.fn()

// Database mock utilities
export const mockDbSelect = (result: any) => ({
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockResolvedValue(result),
})

export const mockDbInsert = (result: any) => ({
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue(result),
  onConflictDoNothing: jest.fn().mockResolvedValue(result),
})

export const mockDbUpdate = (result: any) => ({
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue(result),
})

export const mockDbDelete = (result: any) => ({
  where: jest.fn().mockResolvedValue(result),
})

// Service mocks
export const mockAuthService = () => {
  const mock = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
  }

  // Mock the service methods
  AuthService.prototype.register = mock.register
  AuthService.prototype.login = mock.login
  AuthService.prototype.logout = mock.logout
  AuthService.prototype.refreshToken = mock.refreshToken
  AuthService.prototype.getCurrentUser = mock.getCurrentUser

  return mock
}

export const mockMessageService = () => {
  const mock = {
    createMessage: jest.fn(),
    getMessagesByChat: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
    markMessageAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  }

  // Mock the service methods
  MessageService.prototype.createMessage = mock.createMessage
  MessageService.prototype.getMessagesByChat = mock.getMessagesByChat
  MessageService.prototype.updateMessage = mock.updateMessage
  MessageService.prototype.deleteMessage = mock.deleteMessage
  MessageService.prototype.markMessageAsRead = mock.markMessageAsRead
  MessageService.prototype.getUnreadCount = mock.getUnreadCount

  return mock
}

// JWT mock utilities
export const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-1', email: 'test@example.com' }),
}

// Password mock utilities
export const mockPassword = {
  hash: jest.fn().mockResolvedValue('$2a$10$mockhashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}

// Setup test environment
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.JWT_ACCESS_EXPIRES_IN = '15m'
  process.env.JWT_REFRESH_EXPIRES_IN = '7d'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
  process.env.NODE_ENV = 'test'

  // Mock external dependencies
  jest.mock('../utils/jwt', () => mockJwt)
  jest.mock('../utils/password', () => mockPassword)
}

// Cleanup utilities
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks()
  jest.clearAllTimers()

  // Reset environment variables
  delete process.env.JWT_SECRET
  delete process.env.JWT_ACCESS_EXPIRES_IN
  delete process.env.JWT_REFRESH_EXPIRES_IN
  delete process.env.DATABASE_URL
  delete process.env.NODE_ENV
}

// Custom test hooks
export const useTestSetup = () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })
}

// API testing utilities
export const makeApiRequest = async (app: any, method: string, url: string, options = {}) => {
  const supertest = await import('supertest')
  const request = supertest.default(app)

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  }

  switch (method.toUpperCase()) {
    case 'GET':
      return request.get(url).set(defaultOptions.headers)
    case 'POST':
      return request.post(url).set(defaultOptions.headers).send(defaultOptions.body || {})
    case 'PUT':
      return request.put(url).set(defaultOptions.headers).send(defaultOptions.body || {})
    case 'DELETE':
      return request.delete(url).set(defaultOptions.headers)
    default:
      throw new Error(`Unsupported HTTP method: ${method}`)
  }
}

// Database testing utilities
export const setupTestDatabase = async () => {
  // This would set up a test database
  // For now, it's a placeholder
  console.log('Setting up test database...')
}

export const teardownTestDatabase = async () => {
  // This would clean up the test database
  // For now, it's a placeholder
  console.log('Tearing down test database...')
}

// Performance testing utilities
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()

  return {
    result,
    duration: endTime - startTime,
  }
}

// Validation testing utilities
export const expectValidationError = (response: any, field: string, message?: string) => {
  expect(response.status).toBe(400)
  expect(response.body.success).toBe(false)

  if (message) {
    expect(response.body.error).toContain(message)
  }

  if (field) {
    expect(response.body.details).toBeDefined()
    expect(response.body.details[field]).toBeDefined()
  }
}

export const expectSuccessResponse = (response: any, status = 200) => {
  expect(response.status).toBe(status)
  expect(response.body.success).toBe(true)
  expect(response.body.data).toBeDefined()
}

export const expectErrorResponse = (response: any, status = 400, message?: string) => {
  expect(response.status).toBe(status)
  expect(response.body.success).toBe(false)
  expect(response.body.error).toBeDefined()

  if (message) {
    expect(response.body.error).toContain(message)
  }
}