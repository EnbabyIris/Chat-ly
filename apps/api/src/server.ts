import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig, isDevelopment } from './config';
import { testConnection } from './db';
import { apiRoutes } from './routes';
import { createSocketIOServer } from './socket';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import {
  sanitizeInput,
  securityHeaders,
  apiVersioning,
  requestTimeout,
  sqlInjectionProtection,
  securityLogger
} from './middleware/security';
import { logger } from './utils/logger';

/**
 * Chat-Turbo API Server
 * Production-ready Express + Socket.IO server with TypeScript
 */
class ChatTurboServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private socketServer: ReturnType<typeof createSocketIOServer>;

  constructor() {
    // Validate environment configuration
    validateConfig();

    // Initialize Express app
    this.app = express();
    
    // Create HTTP server
    this.httpServer = createServer(this.app);
    
    // Initialize Socket.IO
    this.socketServer = createSocketIOServer(this.httpServer);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  /**
   * Setup Express middleware stack
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Socket.IO
    }));

    // CORS configuration - Allow all origins for global accessibility
    this.app.use(cors({
      origin: true, // Allow all origins
      credentials: false, // Must be false when using wildcard origin
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    }));

    // Body parsing middleware with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware (applied before business logic)
    this.app.use(securityHeaders);
    this.app.use(apiVersioning);
    this.app.use(securityLogger);
    this.app.use(sanitizeInput);
    this.app.use(sqlInjectionProtection);
    this.app.use(requestTimeout(30000)); // 30 second timeout

    // Global rate limiting
    this.app.use(rateLimiter({
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
    }));

    // Request logging
    this.app.use(logger.requestLogger());

    // Add request timestamp
    this.app.use((req, _res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Root health check
    this.app.get('/', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Chat-Turbo API Server',
        version: '1.0.0',
        environment: config.server.nodeEnv,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: '/api/v1',
        }
      });
    });

    // Mount API routes
    this.app.use('/', apiRoutes);

    // Socket.IO stats endpoint (development only)
    if (isDevelopment()) {
      this.app.get('/socket-stats', (_req, res) => {
        const stats = this.socketServer.getStats();
        res.status(200).json({
          success: true,
          data: {
            ...stats,
            timestamp: new Date().toISOString(),
          }
        });
      });
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler for unknown routes
    this.app.use('*', notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason);
      console.error('Promise:', promise);
      
      if (!isDevelopment()) {
        process.exit(1);
      }
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      
      if (!isDevelopment()) {
        process.exit(1);
      }
    });
  }

  /**
   * Setup graceful shutdown handling
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown`);

      try {
        // Close Socket.IO server
        await this.socketServer.close();

        // Close HTTP server
        this.httpServer.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server', {}, err);
            process.exit(1);
          }

          logger.info('HTTP server closed successfully');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);

      } catch (error) {
        logger.error('Error during graceful shutdown', {}, error as Error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Test database connection
      logger.info('Testing database connection');
      const dbConnected = await testConnection();

      if (!dbConnected) {
        logger.error('Database connection failed. Server cannot start');
        process.exit(1);
      }

      // Initialize background jobs
      logger.info('Initializing background jobs');
      const { scheduleStatusCleanup } = await import('./jobs/status-cleanup.job');
      scheduleStatusCleanup();

      // Start HTTP server
      this.httpServer.listen(config.server.port, config.server.host, () => {
        logger.info('Chat-Turbo API Server Started', {
          server: `http://${config.server.host}:${config.server.port}`,
          environment: config.server.nodeEnv,
          frontendUrl: config.cors.origin,
          database: 'Connected',
          socketIO: 'Enabled',
        });

        if (isDevelopment()) {
          logger.info('Development server endpoints available', {
            endpoints: {
              root: '/',
              health: '/health',
              'socket-stats': '/socket-stats',
              auth: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                refresh: 'POST /api/v1/auth/refresh',
              },
            },
            documentation: 'http://localhost:5000/api/v1',
          });
        }
      });

      // Handle server startup errors
      this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${config.server.port} is already in use`);
          console.error('   Try using a different port or stop the process using this port');
        } else if (error.code === 'EACCES') {
          console.error(`❌ Permission denied to bind to port ${config.server.port}`);
          console.error('   Try using a port number above 1024 or run with elevated privileges');
        } else {
          console.error('❌ Server startup error:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get HTTP server instance
   */
  getHttpServer(): ReturnType<typeof createServer> {
    return this.httpServer;
  }

  /**
   * Get Socket.IO server instance
   */
  getSocketServer(): ReturnType<typeof createSocketIOServer> {
    return this.socketServer;
  }
}

// Create and start server
const server = new ChatTurboServer();

// Start server
server.start().catch((error) => {
  console.error('❌ Failed to start Chat-Turbo server:', error);
  process.exit(1);
});

// Export for testing purposes
export default server;