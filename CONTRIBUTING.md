# Contributing to Chat-Turbo

Thank you for your interest in contributing to Chat-Turbo! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Chat_OS.git`
3. Install dependencies: `pnpm install`
4. Set up your development environment (see [README.md](./README.md))
5. Create a feature branch: `git checkout -b feature/amazing-feature`

## 📋 Development Workflow

### 1. Choose an Issue
- Check [GitHub Issues](https://github.com/dikjain/Chat_OS/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
# or
git checkout -b docs/update-readme
```

### 3. Make Changes
- Follow the [Code Quality Standards](#code-quality-standards)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass: `pnpm test`

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add amazing new feature"
```

Follow [Conventional Commits](https://conventionalcommits.org/) format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```
Then create a Pull Request on GitHub.

## 🎯 Code Quality Standards

### TypeScript Requirements
- **100% TypeScript**: No JavaScript files allowed
- **No `any` types**: Use proper type definitions
- **Strict mode**: All TypeScript files must pass strict checks
- **Interface definitions**: Define proper interfaces for all props and data structures

### Testing Requirements
- **Minimum 80% coverage**: All new code must have comprehensive tests
- **Unit tests**: Test individual functions and components
- **Integration tests**: Test component interactions and API calls
- **E2E tests**: Test complete user workflows (critical paths only)

### Code Style
- **ESLint**: All code must pass ESLint checks
- **Prettier**: Code must be formatted with Prettier
- **Consistent naming**: Use camelCase for variables/functions, PascalCase for components
- **Clear comments**: Add JSDoc comments for public APIs

## 🧪 Testing Guidelines

### Unit Tests
```typescript
// ✅ Good: Descriptive test names and proper assertions
describe('AuthService', () => {
  it('should hash passwords securely', async () => {
    const hashed = await authService.hashPassword('password123')
    expect(hashed).not.toBe('password123')
    expect(await authService.comparePassword('password123', hashed)).toBe(true)
  })
})
```

### Component Tests
```typescript
// ✅ Good: Test user interactions and accessibility
describe('LoginForm', () => {
  it('should show error for invalid email', async () => {
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByText('Invalid email format')).toBeInTheDocument()
  })
})
```

### API Tests
```typescript
// ✅ Good: Test success and error scenarios
describe('POST /api/auth/login', () => {
  it('should return tokens for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200)

    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
  })
})
```

## 📚 Documentation

### Code Documentation
- **JSDoc comments**: Required for all public functions, classes, and methods
- **Type definitions**: Include in shared packages for reuse
- **API endpoints**: Document request/response schemas

### Example JSDoc
```typescript
/**
 * Authenticates a user with email and password
 * @param credentials - User login credentials
 * @returns Promise resolving to authentication tokens
 * @throws {UnauthorizedError} When credentials are invalid
 */
async function loginUser(credentials: LoginCredentials): Promise<AuthTokens> {
  // implementation
}
```

## 🔧 Development Setup

### Environment Variables
Create the following files in their respective directories:

**apps/api/.env**
```env
DATABASE_URL=postgresql://localhost:5432/chat_turbo_dev
JWT_SECRET=your-development-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**apps/web/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### Database Setup
```bash
# Generate schema
pnpm db:generate

# Push to database
pnpm db:push

# Open studio
pnpm db:studio
```

## 🚨 Issue Reporting

When reporting bugs or requesting features:

### Bug Reports
- **Clear title**: Summarize the issue concisely
- **Steps to reproduce**: Provide detailed reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node version, browser, etc.
- **Screenshots/logs**: If applicable

### Feature Requests
- **Clear description**: What feature do you want?
- **Use case**: Why do you need this feature?
- **Alternatives**: Have you considered alternatives?
- **Mockups**: Visual representations if applicable

## 🎉 Recognition

Contributors will be:
- Listed in the repository contributors
- Mentioned in release notes for significant contributions
- Invited to join the project maintainers (for consistent contributors)

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: Join our community chat (link in README)

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Commit messages follow conventional format
- [ ] PR description explains the changes
- [ ] Related issues are linked

Thank you for contributing to Chat-Turbo! 🎉