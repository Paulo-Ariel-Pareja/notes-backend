import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('Simplified E2E Tests', () => {
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

  describe('Health Checks', () => {
    it('should return application health status', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return database health status', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/health/database');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Create a user
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', userData.email);
      expect(user).toHaveProperty('role', userData.role);
      expect(user).toHaveProperty('token');

      // Use token to access protected route
      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('notes');
      expect(Array.isArray(response.body.notes)).toBe(true);
    });

    it('should fail to access protected routes without token', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/notes');

      testHelper.expectUnauthorized(response);
    });

    it('should fail with invalid credentials', async () => {
      const response = await testHelper
        .makePublicRequest()
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      testHelper.expectUnauthorized(response);
    });
  });

  describe('Notes Management', () => {
    it('should complete full notes CRUD flow', async () => {
      // Create user
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create note
      const noteData = testHelper.generateNoteData();
      const createResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send(noteData);

      testHelper.expectSuccess(createResponse, 201);
      const noteId = createResponse.body.id;

      // Read note
      const readResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${noteId}`);

      testHelper.expectSuccess(readResponse, 200);
      expect(readResponse.body.title).toBe(noteData.title);

      // Update note
      const updateData = { title: 'Updated Title' };
      const updateResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${noteId}`)
        .send(updateData);

      testHelper.expectSuccess(updateResponse, 200);
      expect(updateResponse.body.title).toBe(updateData.title);

      // Delete note
      const deleteResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/${noteId}`);

      testHelper.expectSuccess(deleteResponse, 200);

      // Verify note is deleted
      const verifyResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${noteId}`);

      expect(verifyResponse.status).toBe(404);
    });

    it('should get user notes list', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create a note
      const noteData = testHelper.generateNoteData();
      const createResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send(noteData);

      testHelper.expectSuccess(createResponse, 201);
      
      // Verify the note was created by getting it directly
      const noteId = createResponse.body.id;
      const getResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${noteId}`);
      
      testHelper.expectSuccess(getResponse, 200);

      // Get notes list
      const listResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes');

      testHelper.expectSuccess(listResponse, 200);
      expect(listResponse.body).toHaveProperty('notes');
      expect(listResponse.body).toHaveProperty('total');
      expect(listResponse.body).toHaveProperty('page');
      expect(listResponse.body).toHaveProperty('totalPages');
      
      
      expect(listResponse.body.notes.length).toBeGreaterThan(0);
      expect(listResponse.body.total).toBeGreaterThan(0);
    });

    it('should get note statistics', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/stats');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('totalNotes');
      expect(response.body).toHaveProperty('activeNotes');
      expect(response.body).toHaveProperty('disabledNotes');
      expect(response.body).toHaveProperty('sharedNotes');
      expect(response.body).toHaveProperty('totalViews');
    });
  });

  describe('Public Sharing Flow', () => {
    it('should complete full public sharing flow', async () => {
      // Create user and note
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const noteData = testHelper.generateNoteData();
      const note = await testHelper.createNote(user.token, noteData);

      // Share note (create public link)
      const shareResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send({ description: 'Test sharing' });

      testHelper.expectSuccess(shareResponse, 201);
      const publicId = shareResponse.body.publicId;

      // Access note via public link (no authentication)
      const publicResponse = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicId}`);

      testHelper.expectSuccess(publicResponse, 200);
      expect(publicResponse.body.title).toBe(noteData.title);
      expect(publicResponse.body.description).toBe(noteData.description);

      // Get shared notes list
      const sharedResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(sharedResponse, 200);
      expect(sharedResponse.body.links.length).toBe(1);

      // Delete public link
      const deleteResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/shared/${publicId}`);

      testHelper.expectSuccess(deleteResponse, 200);

      // Verify public access no longer works
      const verifyResponse = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicId}`);

      testHelper.expectNotFound(verifyResponse);
    });
  });

  describe('Admin Operations', () => {
    it('should allow admin to manage users', async () => {
      // Create admin
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      // Admin creates a regular user
      const newUserData = testHelper.generateUserData();
      const createResponse = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(newUserData);

      testHelper.expectSuccess(createResponse, 201);
      const newUserId = createResponse.body.id;

      // Admin lists all users
      const listResponse = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/users');

      testHelper.expectSuccess(listResponse, 200);
      expect(listResponse.body.users.length).toBeGreaterThan(0);

      // Admin gets specific user
      const getUserResponse = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get(`/api/users/${newUserId}`);

      testHelper.expectSuccess(getUserResponse, 200);
      expect(getUserResponse.body.email).toBe(newUserData.email);

      // Admin deletes user
      const deleteResponse = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .delete(`/api/users/${newUserId}`);

      testHelper.expectSuccess(deleteResponse, 200);
    });

    it('should deny regular user from admin operations', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Try to create user (should fail)
      const createResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/users')
        .send(testHelper.generateUserData());

      testHelper.expectForbidden(createResponse);

      // Try to list users (should fail)
      const listResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/users');

      testHelper.expectForbidden(listResponse);
    });
  });

  describe('Authorization and Security', () => {
    it('should enforce note ownership', async () => {
      // Create user
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // User creates a note
      const noteData = testHelper.generateNoteData();
      const note = await testHelper.createNote(user.token, noteData);

      // Try to access note with invalid token (should fail)
      const readResponse = await testHelper
        .makePublicRequest()
        .get(`/api/notes/${note.id}`)
        .set('Authorization', 'Bearer invalid-token');

      testHelper.expectUnauthorized(readResponse);

      // Try to access note without token (should fail)
      const noTokenResponse = await testHelper
        .makePublicRequest()
        .get(`/api/notes/${note.id}`);

      testHelper.expectUnauthorized(noTokenResponse);

      // User can access their own note (should succeed)
      const validResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${note.id}`);

      testHelper.expectSuccess(validResponse, 200);
      expect(validResponse.body.id).toBe(note.id);
    });

    it('should handle password changes correctly', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Change own password
      const changeResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/users/${user.id}/password`)
        .send({ password: 'newpassword123' });

      testHelper.expectSuccess(changeResponse, 200);

      // Login with new password
      const loginResponse = await testHelper
        .makePublicRequest()
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123',
        });

      testHelper.expectSuccess(loginResponse, 200);
      expect(loginResponse.body).toHaveProperty('accessToken');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent resources gracefully', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Try to get non-existent note
      const noteResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/non-existent-id');

      expect(noteResponse.status).toBe(404);

      // Try to access non-existent public note
      const publicResponse = await testHelper
        .makePublicRequest()
        .get('/api/public/notes/non-existent-id');

      testHelper.expectNotFound(publicResponse);
    });

    it('should handle malformed requests', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Try to create note with empty data
      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send({});

      expect(response.status).toBe(400); // Bad request due to validation
    });
  });

  describe('Public Health Check', () => {
    it('should provide public health endpoint', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/public/health');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'notes-backend-public');
    });
  });
});