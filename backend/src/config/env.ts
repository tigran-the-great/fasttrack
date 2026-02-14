import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CARRIER_API_URL: z.string().url(),
  CARRIER_API_TIMEOUT: z.coerce.number().default(5000),
  SYNC_CRON_SCHEDULE: z.string().default('*/5 * * * *'),
  SYNC_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3),
  RETRY_BASE_DELAY: z.coerce.number().default(1000),
  RETRY_MAX_DELAY: z.coerce.number().default(10000),
  RETRY_JITTER_FACTOR: z.coerce.number().min(0).max(1).default(0.1),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  SYNC_CONCURRENCY: z.coerce.number().min(1).max(20).default(5),
  SERVER_KEEP_ALIVE_TIMEOUT: z.coerce.number().default(65000),
  SERVER_HEADERS_TIMEOUT: z.coerce.number().default(66000),
  GRACEFUL_SHUTDOWN_TIMEOUT: z.coerce.number().default(10000),
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
