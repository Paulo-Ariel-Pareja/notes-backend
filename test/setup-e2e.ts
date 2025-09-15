// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // DB configuration for tests
  //process.env.DB_TYPE = 'sqlite';
  process.env.DB_DATABASE = 'notes_db_test';
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.DB_LOGGING = 'false';
  process.env.DB_USERNAME = 'postgres';
  process.env.DB_PASSWORD = 'mysecretpassword';
  process.env.DB_PORT = '5444';

  // JWT configuration for tests
  process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
  process.env.JWT_EXPIRES_IN = '1h';

  // Faster bcrypt for tests
  process.env.BCRYPT_ROUNDS = '4';

  // App configuration
  process.env.GLOBAL_PREFIX = 'api';
  process.env.SWAGGER_ENABLED = 'false';

  // Disable logging for cleaner test output
  process.env.LOG_LEVEL = 'error';
  process.env.LOG_CONSOLE = 'false';
});

// Global test teardown
afterAll(() => {
  // Clean up any global resources if needed
});

// Increase timeout for e2e tests
jest.setTimeout(30000);
