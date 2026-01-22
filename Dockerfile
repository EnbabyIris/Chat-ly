# Multi-stage Docker build for Chat-Turbo

# Base stage with common dependencies
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client \
    && apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Build stage
FROM base AS builder

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build all applications
RUN pnpm build

# Production stage for API
FROM node:20-alpine AS api-production

# Install system dependencies for production
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client \
    dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 chat-turbo

# Set working directory
WORKDIR /app

# Copy pnpm and package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages

# Install only production dependencies
RUN npm install -g pnpm@9.1.0 && \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    pnpm store prune

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R chat-turbo:nodejs /app

# Switch to non-root user
USER chat-turbo

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]

# Production stage for Web
FROM node:20-alpine AS web-production

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 chat-turbo

# Set working directory
WORKDIR /app

# Copy pnpm and package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Copy built web application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Install only production dependencies
RUN npm install -g pnpm@9.1.0 && \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    pnpm store prune

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R chat-turbo:nodejs /app

# Switch to non-root user
USER chat-turbo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "start", "--filter=web"]

# Development stage
FROM base AS development

# Install development dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    git

# Create development user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 chat-turbo

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies
RUN pnpm install

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R chat-turbo:nodejs /app

# Switch to non-root user
USER chat-turbo

# Expose ports
EXPOSE 3000 8000

# Default command for development
CMD ["pnpm", "dev"]