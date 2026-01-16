import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/**
 * Get directory name in ES modules (equivalent to __dirname)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables from .env file
 * Checks multiple locations to support different execution contexts:
 * - apps/api/.env (when running from apps/api directory)
 * - repo root .env (when running from monorepo root)
 */
const envPaths = [
  path.resolve(process.cwd(), '.env'), // Current working directory
  path.resolve(__dirname, '..', '..', '.env'), // apps/api/.env (relative to compiled dist/config/index.js)
  path.resolve(process.cwd(), '..', '..', '.env'), // Root .env (from apps/api)
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.error(`❌ Error loading .env from ${envPath}:`, result.error);
      continue;
    }
    console.log(`✅ Loaded environment variables from: ${envPath}`);
    break;
  }
}

/**
 * Server configuration with environment variable validation
 */
export const config = {
  // Server settings
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:5000',
  },

  // Database settings
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chat_turbo_dev',
    ssl: process.env.DATABASE_SSL === 'true',
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_min_32_chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_jwt_key_change_this_in_production_min_32_chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS settings
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // File upload settings
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Socket.IO settings
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    pingTimeout: 60000,
    pingInterval: 25000,
  },

  // Redis settings (optional)
  redis: {
    url: process.env.REDIS_URL,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

/**
 * Validate required environment variables
 */
export const validateConfig = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName]?.trim() === ''
  );

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate JWT secrets length
  if (config.jwt.secret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  if (config.jwt.refreshSecret.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return config.server.nodeEnv === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return config.server.nodeEnv === 'development';
};

/**
 * Check if running in test environment
 */
export const isTest = (): boolean => {
  return config.server.nodeEnv === 'test';
};