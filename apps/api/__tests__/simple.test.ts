// Simple test to verify Jest setup works
describe('Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret')
  })

  it('should import constants without errors', () => {
    // This would normally import from @repo/shared/constants
    // but we've mocked it in jest.setup.js
    const { ERROR_MESSAGES } = require('@repo/shared/constants')
    expect(ERROR_MESSAGES.EMAIL_EXISTS).toBe('Email already exists')
  })
})