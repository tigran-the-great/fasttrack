import { jest, beforeEach, afterAll } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/fasttrack_test';
process.env.CARRIER_API_URL = 'http://localhost:3001';
process.env.CARRIER_API_TIMEOUT = '5000';
process.env.SYNC_CRON_SCHEDULE = '*/5 * * * *';
process.env.SYNC_ENABLED = 'false';
process.env.RETRY_MAX_ATTEMPTS = '3';
process.env.RETRY_BASE_DELAY = '100';
process.env.RETRY_MAX_DELAY = '1000';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(10000);

// Mock console.log in tests to reduce noise
// Uncomment if needed:
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'info').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
