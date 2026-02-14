import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { withRetry, isRetryableError } from '../../src/utils/retry.js';

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = jest.fn<() => Promise<string>>().mockResolvedValue('success');

      const resultPromise = withRetry(operation, 'test-operation');
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const resultPromise = withRetry(operation, 'test-operation', {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterFactor: 0,
      });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts exhausted', async () => {
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValue(new Error('persistent failure'));

      const resultPromise = withRetry(operation, 'test-operation', {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterFactor: 0,
      });

      resultPromise.catch(() => {});

      await jest.advanceTimersByTimeAsync(500);

      await expect(resultPromise).rejects.toThrow('persistent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const resultPromise = withRetry(operation, 'test-operation', {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        jitterFactor: 0,
      });

      await jest.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(200);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for timeout errors', () => {
      expect(isRetryableError(new Error('Request timeout'))).toBe(true);
      expect(isRetryableError(new Error('TIMEOUT'))).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError(new Error('Network error'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('socket hang up'))).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new Error('Validation failed'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
      expect(isRetryableError(new Error('Unauthorized'))).toBe(false);
    });

    it('should return false for non-Error types', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });
});
