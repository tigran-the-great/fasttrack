import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
}

const defaultConfig: RetryConfig = {
  maxAttempts: env.RETRY_MAX_ATTEMPTS,
  baseDelayMs: env.RETRY_BASE_DELAY,
  maxDelayMs: env.RETRY_MAX_DELAY,
  jitterFactor: env.RETRY_JITTER_FACTOR,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
  const boundedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = boundedDelay * config.jitterFactor * Math.random();
  return Math.floor(boundedDelay + jitter);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  context: string,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === finalConfig.maxAttempts) {
        logger.error(`${context} failed after ${attempt} attempts`, {
          error: lastError.message,
          attempts: attempt,
        });
        throw lastError;
      }

      const delay = calculateDelay(attempt, finalConfig);
      logger.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        nextAttempt: attempt + 1,
      });

      await sleep(delay);
    }
  }

  throw lastError;
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('socket hang up')
    );
  }
  return false;
};
