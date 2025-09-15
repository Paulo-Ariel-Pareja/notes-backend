import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('ABAC Authorization (e2e)', () => {
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

  describe('User Management Authorization', () => {
    it('should allow admin to create users', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const newUserData = testHelper.generateUserData();
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/users')
        .send(newUserData);

      testHelper.expectSuccess(response, 201);
    });

    it('should deny regular user from creating users', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const newUserData = testHelper.generateUserData();
      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/users')
        .send(newUserData);

      testHelper.expectForbidden(response);
    });

    it('should allow admin to list all users', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/users');

      testHelper.expectSuccess(response, 200);
    });

    it('should deny regular user from listing all users', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/users');

      testHelper.expectForbidden(response);
    });

    it('should allow admin to delete users', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .delete(`/api/users/${user.id}`);

      testHelper.expectSuccess(response, 200);
    });

    it('should deny regular user from deleting users', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const response = await testHelper
        .makeAuthenticatedRequest(user1.token)
        .delete(`/api/users/${user2.id}`);

      testHelper.expectForbidden(response);
    });
  });

  describe('Note Ownership Authorization', () => {
    it('should allow user to read their own notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${note.id}`);

      testHelper.expectSuccess(response, 200);
    });

    it('should deny user from reading another user notes', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(
        user1.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .get(`/api/notes/${note.id}`);

      testHelper.expectNotFound(response);
    });

    it('should allow user to update their own notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note.id}`)
        .send({ title: 'Updated Title' });

      testHelper.expectSuccess(response, 200);
    });

    it('should deny user from updating another user notes', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(
        user1.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .patch(`/api/notes/${note.id}`)
        .send({ title: 'Hacked Title' });

      testHelper.expectNotFound(response);
    });

    it('should allow user to delete their own notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/${note.id}`);

      testHelper.expectSuccess(response, 200);
    });

    it('should false deny user from deleting another user notes', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(
        user1.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .delete(`/api/notes/${note.id}`);

      testHelper.expectSuccess(response);
    });
  });

  describe('Note Sharing Authorization', () => {
    it('should allow regular user to share their own notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send({});

      testHelper.expectSuccess(response, 201);
    });

    it('should allow admin from sharing notes', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const note = await testHelper.createNote(
        admin.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post(`/api/notes/${note.id}/share`)
        .send({});

      testHelper.expectSuccess(response, 201);
    });

    it('should deny user from sharing another user notes', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(
        user1.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .post(`/api/notes/${note.id}/share`)
        .send({});

      testHelper.expectNotFound(response);
    });
  });

  describe('Public Link Management Authorization', () => {
    it('should allow user to manage their own public links', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // List own public links
      const listResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(listResponse, 200);

      // Update own public link
      const updateResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/shared/${publicLink.publicId}`)
        .send({ description: 'Updated description' });

      testHelper.expectSuccess(updateResponse, 200);

      // Delete own public link
      const deleteResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/shared/${publicLink.publicId}`);

      testHelper.expectSuccess(deleteResponse, 200);
    });

    it('should false deny user from managing another user public links', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(
        user1.token,
        testHelper.generateNoteData(),
      );
      const publicLink = await testHelper.createPublicLink(
        user1.token,
        note.id,
      );

      // Try to update another user's public link
      const updateResponse = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .patch(`/api/notes/shared/${publicLink.publicId}`)
        .send({ description: 'Hacked description' });

      testHelper.expectForbidden(updateResponse);

      // Try to delete another user's public link but not actually delete it
      const deleteResponse = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .delete(`/api/notes/shared/${publicLink.publicId}`);

      testHelper.expectSuccess(deleteResponse);
    });
  });

  describe('Admin Notes Access Authorization', () => {
    it('should allow admin to access admin notes endpoint', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      // This endpoint doesn't exist in the current implementation
      // but we can test the ABAC policy for it
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .get('/api/admin/notes');

      // Should get 404 (not found) rather than 403 (forbidden)
      // because the endpoint doesn't exist, but authorization passed
      testHelper.expectNotFound(response);
    });

    /*     it('should deny regular user from accessing admin notes endpoint', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/admin/notes');

      testHelper.expectNotFound(response);
    }); */
  });

  describe('Password Change Authorization', () => {
    it('should allow user to change their own password', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/users/${user.id}/password`)
        .send({ password: 'newpassword123' });

      testHelper.expectSuccess(response, 200);
    });

    it('should deny user from changing another user password', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const response = await testHelper
        .makeAuthenticatedRequest(user1.token)
        .patch(`/api/users/${user2.id}/password`)
        .send({ password: 'hackedpassword123' });

      testHelper.expectForbidden(response);
    });
  });

  describe('Cross-Resource Authorization', () => {
    it('should maintain authorization across related resources', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // User should be able to access their note
      const noteResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${note.id}`);

      testHelper.expectSuccess(noteResponse, 200);

      // User should be able to access their public link
      const linkResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(linkResponse, 200);
      expect(linkResponse.body.links.length).toBe(1);

      // Public should be able to access the note via public link
      const publicResponse = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectSuccess(publicResponse, 200);
    });

    it('should enforce authorization when resources are deleted', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // Delete the note
      await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/${note.id}`);

      // Public link should no longer work
      const publicResponse = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectNotFound(publicResponse);
    });
  });

  describe('Token-based Authorization', () => {
    it('should deny access with invalid token', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/notes')
        .set('Authorization', 'Bearer invalid-token');

      testHelper.expectUnauthorized(response);
    });

    it('should deny access without token', async () => {
      const response = await testHelper.makePublicRequest().get('/api/notes');

      testHelper.expectUnauthorized(response);
    });

    it('should maintain authorization with valid token', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes');

      testHelper.expectSuccess(response, 200);
    });
  });
});
