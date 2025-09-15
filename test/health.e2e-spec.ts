import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';

describe('Health Checks (e2e)', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setupApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('/api/health (GET)', () => {
    it('should return application health status', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return consistent timestamp format', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      testHelper.expectSuccess(response, 200);
      
      // Verify timestamp is a valid ISO string
      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(() => new Date(timestamp)).not.toThrow();
      
      const parsedDate = new Date(timestamp);
      expect(parsedDate.toISOString()).toBe(timestamp);
    });

    it('should return health status quickly', async () => {
      const startTime = Date.now();
      
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      testHelper.expectSuccess(response, 200);
      
      // Health check should be fast (less than 1 second)
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('/api/health/database (GET)', () => {
    it('should return database health status', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/database');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should verify database connectivity', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/database');

      testHelper.expectSuccess(response, 200);
      
      // If we get a successful response, database is connected
      expect(response.body.database).toBe('connected');
    });

    it('should return database health status quickly', async () => {
      const startTime = Date.now();
      
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/database');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      testHelper.expectSuccess(response, 200);
      
      // Database health check should be reasonably fast (less than 2 seconds)
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Health Check Reliability', () => {
    it('should return consistent health status across multiple calls', async () => {
      const responses = await Promise.all([
        testHelper.makePublicRequest().get('/api/health'),
        testHelper.makePublicRequest().get('/api/health'),
        testHelper.makePublicRequest().get('/api/health'),
      ]);

      responses.forEach(response => {
        testHelper.expectSuccess(response, 200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should handle concurrent health check requests', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        testHelper.makePublicRequest().get('/api/health')
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        testHelper.expectSuccess(response, 200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should maintain health status during application load', async () => {
      // Create some load by making multiple concurrent health requests
      const healthPromises = Array(10).fill(null).map(() =>
        testHelper.makePublicRequest().get('/api/health')
      );

      const responses = await Promise.all(healthPromises);

      // All health checks should succeed
      responses.forEach(response => {
        testHelper.expectSuccess(response, 200);
        expect(response.body.status).toBe('ok');
      });
    });
  });

  describe('Health Check Security', () => {
    it('should not expose sensitive information in health checks', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      testHelper.expectSuccess(response, 200);
      
      // Should not expose sensitive system information
      expect(response.body).not.toHaveProperty('environment');
      expect(response.body).not.toHaveProperty('secrets');
      expect(response.body).not.toHaveProperty('config');
      expect(response.body).not.toHaveProperty('database_url');
      expect(response.body).not.toHaveProperty('jwt_secret');
    });

    it('should not expose database connection details', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/database');

      testHelper.expectSuccess(response, 200);
      
      // Should not expose database connection details
      expect(response.body).not.toHaveProperty('host');
      expect(response.body).not.toHaveProperty('port');
      expect(response.body).not.toHaveProperty('username');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('connection_string');
    });
  });

  describe('Health Check Error Handling', () => {
    it('should handle invalid health endpoints gracefully', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/invalid-endpoint');

      testHelper.expectNotFound(response);
    });

    it('should return proper content type for health checks', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      testHelper.expectSuccess(response, 200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});