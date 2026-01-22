// Jest setup for API tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Mock problematic ES modules
jest.mock('../src/config/index.ts', () => ({
  config: {
    database: {
      url: 'postgresql://test:test@localhost:5432/test_db',
      ssl: false,
    },
    jwt: {
      secret: 'test-jwt-secret',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    server: {
      port: 8000,
      host: 'localhost',
    },
  },
}))

jest.mock('../src/db/index.ts', () => ({
  db: {
    select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn() })) })),
    insert: jest.fn(() => ({ values: jest.fn(() => ({ returning: jest.fn() })) })),
    update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ returning: jest.fn() })) })) })),
    delete: jest.fn(() => ({ where: jest.fn() })),
  },
}))

jest.mock('@repo/shared/constants', () => ({
  ERROR_MESSAGES: {
    EMAIL_EXISTS: 'Email already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_NOT_FOUND: 'User not found',
    MESSAGE_NOT_FOUND: 'Message not found',
    UNAUTHORIZED: 'Unauthorized access',
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

// Global test setup
beforeAll(async () => {
  // Setup database connection or mocks
})

afterAll(async () => {
  // Cleanup database connections
})

afterEach(() => {
  jest.clearAllMocks()
})