import { Router } from "express";
import { testConnection } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// Basic health check
router.get("/health", async (_req, res) => {
  const timer = logger.time("health-check");

  try {
    // Check database connection
    const dbHealthy = await testConnection();

    const health = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbHealthy ? "connected" : "disconnected",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    const statusCode = dbHealthy ? 200 : 503;

    logger.info("Health check completed", {
      status: health.status,
      responseTime: Date.now(),
    });

    timer();
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Health check failed", {}, error as Error);
    timer();

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

// Detailed health check with dependencies
router.get("/health/detailed", async (_req, res) => {
  const timer = logger.time("detailed-health-check");

  try {
    const startTime = Date.now();

    // Database health
    const dbStart = Date.now();
    const dbHealthy = await testConnection();
    const dbResponseTime = Date.now() - dbStart;

    // System metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const detailedHealth = {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: {
          status: dbHealthy ? "healthy" : "unhealthy",
          responseTime: dbResponseTime,
          type: "postgresql",
        },
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          usagePercent: Math.round(
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
          ),
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
          system: Math.round(cpuUsage.system / 1000),
        },
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
      dependencies: {
        node: process.version,
        environment: Object.keys(process.env)
          .filter((key) => ["NODE_ENV", "PORT", "DATABASE_URL"].includes(key))
          .reduce(
            (acc, key) => {
              acc[key] = key.includes("URL")
                ? "[REDACTED]"
                : process.env[key] || "";
              return acc;
            },
            {} as Record<string, string>,
          ),
      },
    };

    const statusCode = dbHealthy ? 200 : 503;

    logger.info("Detailed health check completed", {
      status: detailedHealth.status,
      responseTime: detailedHealth.responseTime,
      dbResponseTime,
    });

    timer();
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    logger.error("Detailed health check failed", {}, error as Error);
    timer();

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Detailed health check failed",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

// Readiness probe (Kubernetes)
router.get("/health/ready", async (_req, res) => {
  try {
    const dbHealthy = await testConnection();

    if (dbHealthy) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        reason: "Database connection failed",
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      reason: "Health check error",
    });
  }
});

// Liveness probe (Kubernetes)
router.get("/health/live", (_req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint (Prometheus format)
router.get("/metrics", (_req, res) => {
  const metrics = [
    "# HELP chat_turbo_uptime_seconds Time the server has been running",
    "# TYPE chat_turbo_uptime_seconds gauge",
    `chat_turbo_uptime_seconds ${process.uptime()}`,
    "",
    "# HELP chat_turbo_memory_used_bytes Memory used by the process",
    "# TYPE chat_turbo_memory_used_bytes gauge",
    `chat_turbo_memory_used_bytes ${process.memoryUsage().heapUsed}`,
    "",
    "# HELP chat_turbo_memory_total_bytes Total memory allocated",
    "# TYPE chat_turbo_memory_total_bytes gauge",
    `chat_turbo_memory_total_bytes ${process.memoryUsage().heapTotal}`,
    "",
    "# HELP chat_turbo_version_info Version information",
    "# TYPE chat_turbo_version_info gauge",
    `chat_turbo_version_info{version="${process.env.npm_package_version || "1.0.0"}"} 1`,
  ];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(metrics.join("\n"));
});

export default router;
