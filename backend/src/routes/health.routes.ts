import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { healthRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

interface HealthCheck {
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}

router.get('/', healthRateLimiter, (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', healthRateLimiter, async (_req: Request, res: Response) => {
  const checks: Record<string, HealthCheck> = {};
  let isHealthy = true;

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (error) {
    isHealthy = false;
    checks.database = {
      status: 'error',
      latency: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const carrierStart = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.HEALTH_CHECK_TIMEOUT);
    await fetch(`${env.CARRIER_API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    checks.carrier = { status: 'ok', latency: Date.now() - carrierStart };
  } catch (error) {
    checks.carrier = {
      status: 'error',
      latency: Date.now() - carrierStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

export const healthRoutes = router;
