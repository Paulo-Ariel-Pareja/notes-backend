import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('Users (e2e)', () => {
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

  describe('/api/users (POST)', () => {
    it('should create user as admin', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const newUserData = testHelper.generateUserData();
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(newUserData);

      testHelper.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(newUserData.email);
      expect(response.body.role).toBe(newUserData.role);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to create user as regular user', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const newUserData = testHelper.generateUserData();
      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/users')
        .send(newUserData);

      testHelper.expectForbidden(response);
    });

    it('should fail to create user without authentication', async () => {
      const newUserData = testHelper.generateUserData();
      const response = await testHelper
        .makePublicRequest()
        .post('/api/users')
        .send(newUserData);

      testHelper.expectUnauthorized(response);
    });

    it('should fail with invalid email', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      testHelper.expectValidationError(response, 'email');
    });

    it('should fail with short password', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      testHelper.expectValidationError(response, 'password');
    });

    it('should fail with duplicate email', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const userData = testHelper.generateUserData();
      
      // Create first user
      await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(userData);

      // Try to create second user with same email
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should create admin user', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const newAdminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(newAdminData);

      testHelper.expectSuccess(response, 201);
      expect(response.body.role).toBe(UserRole.ADMIN);
    });
  });

  describe('/api/users (GET)', () => {
    it('should get all users as admin', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      // Create some additional users
      await testHelper.createUser(testHelper.generateUserData());
      await testHelper.createUser(testHelper.generateUserData());

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/users');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should fail to get users as regular user', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/users');

      testHelper.expectForbidden(response);
    });

    it('should support pagination', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await testHelper.createUser(testHelper.generateUserData());
      }

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/users?page=1&limit=2');

      testHelper.expectSuccess(response, 200);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
    });
  });

  describe('/api/users/:id (GET)', () => {
    it('should get user by id as admin', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);
      
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get(`/api/users/${user.id}`);

      testHelper.expectSuccess(response, 200);
      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to get user by id as regular user', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/users/${user.id}`);

      testHelper.expectForbidden(response);
    });

    it('should fail with non-existent user id', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/users/non-existent-id');

      testHelper.expectNotFound(response);
    });
  });

  describe('/api/users/:id/password (PATCH)', () => {
    it('should change own password', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/users/${user.id}/password`)
        .send({
          password: 'newpassword123',
        });

      testHelper.expectSuccess(response, 200);
      expect(response.body.message).toContain('Password changed successfully');

      // Verify can login with new password
      const loginResponse = await testHelper.makePublicRequest()
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123',
        });

      testHelper.expectSuccess(loginResponse, 200);
    });

    it('should fail to change another user password', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const response = await testHelper
        .makeAuthenticatedRequest(user1.token)
        .patch(`/api/users/${user2.id}/password`)
        .send({
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with short password', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/users/${user.id}/password`)
        .send({
          password: '123',
        });

      testHelper.expectValidationError(response, 'password');
    });
  });

  describe('/api/users/:id (DELETE)', () => {
    it('should delete user as admin', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);
      
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .delete(`/api/users/${user.id}`);

      testHelper.expectSuccess(response, 200);
      expect(response.body.message).toContain('User deleted successfully');

      // Verify user is deleted
      const getResponse = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get(`/api/users/${user.id}`);

      testHelper.expectNotFound(getResponse);
    });

    it('should fail to delete user as regular user', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const response = await testHelper
        .makeAuthenticatedRequest(user1.token)
        .delete(`/api/users/${user2.id}`);

      testHelper.expectForbidden(response);
    });

    it('should fail with non-existent user id', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .delete('/api/users/non-existent-id');

      testHelper.expectNotFound(response);
    });
  });
});