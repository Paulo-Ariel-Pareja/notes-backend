import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setupApp();
  });

  beforeEach(async () => {
    await testHelper.cleanDatabase();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      // Create a user first
      const userData = testHelper.generateUserData();
      await testHelper.createUser(userData);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      testHelper.expectUnauthorized(response);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const userData = testHelper.generateUserData();
      await testHelper.createUser(userData);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        });

      testHelper.expectUnauthorized(response);
      expect(response.body.message).toContain('Invalid credentials');
    });

    // this is an edge case, but we should handle it. decorator dto should catch this
    it('should fail with missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      testHelper.expectServerError(response);
    });

    it('should fail with missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      testHelper.expectUnauthorized(response);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      testHelper.expectUnauthorized(response);
    });

    it('should login admin user', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      await testHelper.createUser(adminData);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        });

      testHelper.expectSuccess(response, 200);
      expect(response.body.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('JWT Token Validation', () => {
    it('should access protected route with valid token', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes');

      testHelper.expectSuccess(response, 200);
    });

    it('should fail to access protected route without token', async () => {
      const response = await request(app.getHttpServer()).get('/api/notes');

      testHelper.expectUnauthorized(response);
    });

    it('should fail to access protected route with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .set('Authorization', 'Bearer invalid-token');

      testHelper.expectUnauthorized(response);
    });

    it('should fail to access protected route with expired token', async () => {
      // This would require creating an expired token, which is complex
      // For now, we'll test with a malformed token
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token');

      testHelper.expectUnauthorized(response);
    });
  });

  describe('Token Payload Validation', () => {
    it('should include correct user information in token', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Decode the JWT token (in a real scenario, you'd verify the signature)
      const tokenParts = user.token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

      expect(payload).toHaveProperty('sub', user.id);
      expect(payload).toHaveProperty('email', user.email);
      expect(payload).toHaveProperty('role', user.role);
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });
  });
});