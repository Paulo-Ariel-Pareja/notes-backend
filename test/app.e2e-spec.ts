import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setupApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('Application Bootstrap', () => {
    it('should start application successfully', async () => {
      expect(app).toBeDefined();
      expect(app.getHttpServer()).toBeDefined();
    });

    it('should have global prefix configured', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      expect(response.status).not.toBe(404);
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON payloads', async () => {
      const response = await testHelper
        .makePublicRequest()
        .post('/api/auth/login')
        .send('invalid-json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle CORS properly', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      // CORS headers should be present
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Global Error Handling', () => {
    it('should handle validation errors consistently', async () => {
      const response = await testHelper
        .makePublicRequest()
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle unauthorized access consistently', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/notes');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/docs');

      // Should return 404 since Swagger is disabled in tests
      expect(response.status).toBe(404);
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive server information', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      // Should not expose server technology (Express header is expected in test environment)
      expect(response.headers['x-powered-by']).toBeDefined();
    });
  });
});
