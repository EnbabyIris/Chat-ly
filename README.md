# Chat-Turbo 🚀

A production-ready, enterprise-grade chat application built with modern technologies. This monorepo provides real-time messaging, user authentication, and scalable architecture for building robust chat experiences.

[![CI/CD](https://github.com/dikjain/Chat_OS/actions/workflows/ci.yml/badge.svg)](https://github.com/dikjain/Chat_OS/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/dikjain/Chat_OS/branch/main/graph/badge.svg)](https://codecov.io/gh/dikjain/Chat_OS)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 Features

- **Real-time Messaging**: Socket.IO-powered instant messaging
- **User Authentication**: JWT-based secure authentication with refresh tokens
- **Modern UI**: Responsive React interface with TailwindCSS
- **Type Safety**: 100% TypeScript coverage
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Testing**: Comprehensive unit, integration, and E2E test suites
- **CI/CD**: Automated testing, security scanning, and deployment
- **Performance**: Optimized for Core Web Vitals and scalability

## 🏗️ Architecture

This monorepo follows clean architecture principles with clear separation of concerns:

```
chat-turbo/
├── apps/
│   ├── web/           # Next.js 16 frontend (App Router)
│   ├── api/           # Express.js + Socket.IO backend
│   └── docs/          # Documentation site
├── packages/
│   ├── shared/        # Shared types, validations, constants
│   ├── ui/            # Reusable UI component library
│   ├── eslint-config/ # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
├── testing/           # Repository evaluation tools
└── tools/             # Development utilities
```

### Tech Stack

**Frontend:**
- Next.js 16 with App Router
- React 18 with TypeScript
- TailwindCSS for styling
- TanStack Query for server state
- Zustand for client state
- Socket.IO client for real-time features

**Backend:**
- Node.js with Express.js
- TypeScript throughout
- Socket.IO for WebSocket connections
- PostgreSQL with Drizzle ORM
- JWT authentication
- Zod for input validation

**Development:**
- Turborepo for monorepo management
- pnpm for package management
- Jest + React Testing Library for unit tests
- Playwright for E2E testing
- ESLint + Prettier for code quality

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x
- pnpm 9.x
- PostgreSQL 15+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dikjain/Chat_OS.git
   cd chat-turbo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the environment files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   Configure your environment variables (see [Environment Setup](#environment-setup) below).

4. **Set up the database**
   ```bash
   cd apps/api
   pnpm db:generate  # Generate schema
   pnpm db:push      # Push to database
   pnpm db:migrate   # Run migrations
   ```

5. **Start development servers**
   ```bash
   # From project root
   pnpm dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Database studio: http://localhost:5555 (optional)

## 📖 Documentation

- [API Documentation](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)
- [Architecture Overview](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🧪 Testing

Run the complete test suite:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run specific app tests
pnpm test --filter=web
pnpm test --filter=api
```

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm dev --filter=web      # Start only frontend
pnpm dev --filter=api      # Start only backend

# Building
pnpm build                 # Build all apps
pnpm build --filter=web   # Build only frontend

# Quality checks
pnpm lint                  # Run ESLint
pnpm check-types          # Run TypeScript checks
pnpm format               # Format code with Prettier

# Database
pnpm db:generate          # Generate Drizzle schema
pnpm db:push              # Push schema changes
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio
```

### Environment Setup

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/chat_turbo

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=8000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Domain configured
- [ ] Monitoring and logging set up
- [ ] Security headers configured

### Deployment Options

#### Vercel + Railway (Recommended)
1. **Frontend**: Deploy to Vercel
2. **Backend**: Deploy to Railway
3. **Database**: Use Railway PostgreSQL

#### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security

This application implements enterprise-grade security measures:

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Express rate limiting
- **CORS**: Properly configured CORS policies
- **Helmet**: Security headers
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM

## 📊 Performance

- **Core Web Vitals**: Optimized for real user metrics
- **Bundle Size**: < 250KB JavaScript bundle
- **Database**: Optimized queries with proper indexing
- **Caching**: Redis integration for session and data caching
- **CDN**: Static assets served via CDN

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper tests
4. Run the test suite: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality Standards

- **TypeScript**: 100% type coverage, no `any` types
- **Testing**: Minimum 80% test coverage
- **Linting**: ESLint + Prettier compliance
- **Commits**: Conventional commit format
- **Documentation**: JSDoc for public APIs

## 📈 Monitoring & Analytics

- **Application Metrics**: Response times, error rates, throughput
- **Database Monitoring**: Query performance, connection pooling
- **Real-time Monitoring**: Socket connection health
- **Error Tracking**: Comprehensive error logging and alerting

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database status
pnpm db:studio

# Reset database
pnpm db:push --force-reset
```

**Build Failures**
```bash
# Clear caches
rm -rf node_modules/.cache
pnpm install
pnpm build
```

**Test Failures**
```bash
# Run tests in verbose mode
pnpm test --verbose

# Run specific test
pnpm test -- apps/web/__tests__/component.test.tsx
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Turborepo](https://turborepo.com)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/dikjain/Chat_OS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dikjain/Chat_OS/discussions)
- **Documentation**: [docs/](./docs/)

---

**Chat-Turbo** - Enterprise-grade chat applications made simple. 🚀
