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

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Global rate limiting
    this.app.use(rateLimiter({
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
    }));

    // Request logging in development
    if (isDevelopment()) {
      this.app.use((req, _res, next) => {
        console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
      });
    }

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
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      try {
        // Close Socket.IO server
        await this.socketServer.close();

        // Close HTTP server
        this.httpServer.close((err) => {
          if (err) {
            console.error('❌ Error closing HTTP server:', err);
            process.exit(1);
          }

          console.log('✅ HTTP server closed');
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 10000);

      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
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
      console.log('🔍 Testing database connection...');
      const dbConnected = await testConnection();
      
      if (!dbConnected) {
        console.error('❌ Database connection failed. Server cannot start.');
        process.exit(1);
      }

      // Start HTTP server
      this.httpServer.listen(config.server.port, config.server.host, () => {
        console.log('\n🚀 Chat-Turbo API Server Started!');
        console.log('================================');
        console.log(`📡 Server: http://${config.server.host}:${config.server.port}`);
        console.log(`🌐 Environment: ${config.server.nodeEnv}`);
        console.log(`🔗 Frontend URL: ${config.cors.origin}`);
        console.log(`💾 Database: Connected`);
        console.log(`🔌 Socket.IO: Enabled`);
        console.log('================================');
        
        if (isDevelopment()) {
          console.log('\n📋 Available Endpoints:');
          console.log('  GET  /                    - Server info');
          console.log('  GET  /health              - Health check');
          console.log('  GET  /api/v1              - API documentation');
          console.log('  GET  /socket-stats        - Socket.IO statistics');
          console.log('\n🔐 Authentication:');
          console.log('  POST /api/v1/auth/register - Register user');
          console.log('  POST /api/v1/auth/login    - Login user');
          console.log('  POST /api/v1/auth/refresh  - Refresh token');
          console.log('\n💬 Real-time Features:');
          console.log('  Socket.IO endpoint available for real-time messaging');
          console.log('  Connect with JWT token for authentication');
          console.log('\n📖 Documentation: http://localhost:5000/api/v1');
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