import { DatabaseClient } from '../infrastructure/db/client';

// Setup test environment
beforeAll(async () => {
  // Connect to test database
  await DatabaseClient.connect();
});

afterAll(async () => {
  // Cleanup and disconnect
  await DatabaseClient.disconnect();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long-different';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/ProjectorDb_test';
process.env.LOG_LEVEL = 'error';