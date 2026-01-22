import { AuthService } from '../../src/services/auth.service'
import { db } from '../../src/db'
import { hashPassword, comparePassword } from '../../src/utils/password'
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt'
import { ConflictError, UnauthorizedError } from '../../src/utils/errors'
import { ERROR_MESSAGES } from '@repo/shared/constants'
import { createMockUser, setupTestEnvironment, cleanupTestEnvironment } from '../../src/utils/test-utils'

// Mock dependencies
jest.mock('../../src/db')
jest.mock('../../src/utils/password')
jest.mock('../../src/utils/jwt')
jest.mock('@repo/shared/constants', () => ({
  ERROR_MESSAGES: {
    EMAIL_EXISTS: 'Email already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_NOT_FOUND: 'User not found',
  },
}))

const mockDb = db as jest.Mocked<typeof db>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    setupTestEnvironment()
    authService = new AuthService()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('register', () => {
    const registerData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      avatar: 'avatar.jpg',
    }

    it('should register a new user successfully', async () => {
      // Mock user not existing
      mockDb.query.users.findFirst.mockResolvedValue(null)

      // Mock password hashing
      mockHashPassword.mockResolvedValue('hashedPassword')

      // Mock user creation
      const mockUser = {
        id: 'user-1',
        name: registerData.name,
        email: registerData.email.toLowerCase(),
        password: 'hashedPassword',
        avatar: registerData.avatar,
      }
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUser]),
      } as any)

      // Mock token generation
      mockGenerateAccessToken.mockReturnValue('access-token')
      mockGenerateRefreshToken.mockReturnValue('refresh-token')

      // Mock refresh token storage
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await authService.register(registerData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken', 'access-token')
      expect(result).toHaveProperty('refreshToken', 'refresh-token')
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      })
      expect(mockHashPassword).toHaveBeenCalledWith(registerData.password)
    })

    it('should throw ConflictError if user already exists', async () => {
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: registerData.email,
      } as any)

      await expect(authService.register(registerData)).rejects.toThrow(ConflictError)
      await expect(authService.register(registerData)).rejects.toThrow(ERROR_MESSAGES.EMAIL_EXISTS)
    })
  })

  describe('login', () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123',
    }

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        password: 'hashedPassword',
      }

      mockDb.query.users.findFirst.mockResolvedValue(mockUser as any)
      mockComparePassword.mockResolvedValue(true)
      mockGenerateAccessToken.mockReturnValue('access-token')
      mockGenerateRefreshToken.mockReturnValue('refresh-token')

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await authService.login(loginData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken', 'access-token')
      expect(result).toHaveProperty('refreshToken', 'refresh-token')
      expect(mockComparePassword).toHaveBeenCalledWith(loginData.password, mockUser.password)
    })

    it('should throw UnauthorizedError for invalid credentials', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null)

      await expect(authService.login(loginData)).rejects.toThrow(UnauthorizedError)
      await expect(authService.login(loginData)).rejects.toThrow(ERROR_MESSAGES.INVALID_CREDENTIALS)
    })

    it('should throw UnauthorizedError for wrong password', async () => {
      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        password: 'hashedPassword',
      }

      mockDb.query.users.findFirst.mockResolvedValue(mockUser as any)
      mockComparePassword.mockResolvedValue(false)

      await expect(authService.login(loginData)).rejects.toThrow(UnauthorizedError)
    })
  })
})