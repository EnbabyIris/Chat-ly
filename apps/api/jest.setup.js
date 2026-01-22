// Jest setup for API tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Mock external dependencies if needed
jest.mock('./src/config/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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