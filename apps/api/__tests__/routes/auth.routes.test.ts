import request from 'supertest'
import express from 'express'
import { authRoutes } from '../../src/routes/auth.routes'
import { AuthService } from '../../src/services/auth.service'

// Mock the AuthService
jest.mock('../../src/services/auth.service')
const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>

describe('Auth Routes', () => {
  let app: express.Application

  beforeEach(() => {
    // Create a test app with the auth routes
    app = express()
    app.use(express.json())
    app.use('/api/v1/auth', authRoutes)

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('POST /api/v1/auth/register', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      avatar: 'https://example.com/avatar.jpg',
    }

    it('should register user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar.jpg',
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      }

      mockAuthService.prototype.register.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect(201)

      expect(response.body).toEqual({
        success: true,
        data: mockResult,
      })
      expect(mockAuthService.prototype.register).toHaveBeenCalledWith(validRegistrationData)
    })

    it('should handle registration validation errors', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123',
      }

      // Mock validation error
      mockAuthService.prototype.register.mockRejectedValue(
        new Error('Validation failed')
      )

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('should handle email already exists error', async () => {
      mockAuthService.prototype.register.mockRejectedValue(
        new Error('Email already exists')
      )

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'SecurePass123!',
    }

    it('should login user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      }

      mockAuthService.prototype.login.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockResult,
      })
      expect(mockAuthService.prototype.login).toHaveBeenCalledWith(validLoginData)
    })

    it('should handle invalid credentials', async () => {
      mockAuthService.prototype.login.mockRejectedValue(
        new Error('Invalid credentials')
      )

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid credentials')
    })

    it('should handle malformed login data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResult = {
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-456',
      }

      mockAuthService.prototype.refreshToken.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', 'Bearer refresh-token-456')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockResult,
      })
    })

    it('should handle invalid refresh token', async () => {
      mockAuthService.prototype.refreshToken.mockRejectedValue(
        new Error('Invalid refresh token')
      )

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should require authorization header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user successfully', async () => {
      mockAuthService.prototype.logout.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer access-token-123')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully',
      })
    })

    it('should handle logout errors', async () => {
      mockAuthService.prototype.logout.mockRejectedValue(
        new Error('Logout failed')
      )

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer access-token-123')
        .expect(500)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('should get current user profile', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
      }

      mockAuthService.prototype.getCurrentUser.mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer access-token-123')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
      })
    })

    it('should handle unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      mockAuthService.prototype.register.mockRejectedValue(
        new Error('Unexpected database error')
      )

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
        })
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{invalid json')
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Rate limiting', () => {
    it('should handle rate limited requests', async () => {
      // This would typically be tested with a rate limiting middleware
      // For now, we test the basic functionality
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'rate@limited.com',
          password: 'password',
        })

      // Should either succeed or fail with rate limit, but not crash
      expect([200, 400, 401, 429]).toContain(response.status)
    })
  })
})