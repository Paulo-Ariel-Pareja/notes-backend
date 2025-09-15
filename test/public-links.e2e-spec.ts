import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('Public Links (e2e)', () => {
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

  describe('/api/notes/:id/share (POST)', () => {
    it('should create public link for own note as regular user', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const linkData = testHelper.generatePublicLinkData();

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send(linkData);

      testHelper.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('publicId');
      expect(response.body.description).toBe(linkData.description);
      expect(response.body.viewCount).toBe(0);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should fail to create public link as admin (business rule)', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const note = await testHelper.createNote(admin.token, testHelper.generateNoteData());
      const linkData = testHelper.generatePublicLinkData();

      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post(`/api/notes/${note.id}/share`)
        .send(linkData);

      testHelper.expectForbidden(response);
    });

    it('should fail to create public link for another user note', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(user1.token, testHelper.generateNoteData());
      const linkData = testHelper.generatePublicLinkData();

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .post(`/api/notes/${note.id}/share`)
        .send(linkData);

      testHelper.expectForbidden(response);
    });

    it('should create public link with expiration date', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now

      const linkData = testHelper.generatePublicLinkData({
        expiresAt: expirationDate.toISOString(),
      });

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send(linkData);

      testHelper.expectSuccess(response, 201);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should create public link without optional fields', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send({});

      testHelper.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('publicId');
    });

    it('should fail with invalid expiration date format', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post(`/api/notes/${note.id}/share`)
        .send({
          expiresAt: 'invalid-date',
        });

      testHelper.expectValidationError(response, 'expiresAt');
    });
  });

  describe('/api/notes/shared (GET)', () => {
    it('should get user public links', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note1 = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const note2 = await testHelper.createNote(user.token, testHelper.generateNoteData());

      await testHelper.createPublicLink(user.token, note1.id);
      await testHelper.createPublicLink(user.token, note2.id);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('links');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.links)).toBe(true);
      expect(response.body.links.length).toBe(2);
    });

    it('should not see other users public links', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(user1.token, testHelper.generateNoteData());
      await testHelper.createPublicLink(user1.token, note.id);

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(response, 200);
      expect(response.body.links.length).toBe(0);
    });

    it('should support pagination', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create multiple public links
      for (let i = 0; i < 5; i++) {
        const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
        await testHelper.createPublicLink(user.token, note.id);
      }

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared?page=1&limit=2');

      testHelper.expectSuccess(response, 200);
      expect(response.body.links.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
    });
  });

  describe('/api/notes/shared/stats (GET)', () => {
    it('should get public link statistics', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note1 = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const note2 = await testHelper.createNote(user.token, testHelper.generateNoteData());

      await testHelper.createPublicLink(user.token, note1.id);
      
      // Create expired link
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      await testHelper.createPublicLink(user.token, note2.id, {
        expiresAt: pastDate.toISOString(),
      });

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared/stats');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('totalLinks');
      expect(response.body).toHaveProperty('activeLinks');
      expect(response.body).toHaveProperty('expiredLinks');
      expect(response.body).toHaveProperty('totalViews');
    });
  });

  describe('/api/notes/shared/:publicId (PATCH)', () => {
    it('should update own public link', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      const updateData = {
        description: 'Updated description',
      };

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/shared/${publicLink.publicId}`)
        .send(updateData);

      testHelper.expectSuccess(response, 200);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should fail to update another user public link', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(user1.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user1.token, note.id);

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .patch(`/api/notes/shared/${publicLink.publicId}`)
        .send({ description: 'Hacked!' });

      expect(response.status).toBe(400);
    });
  });

  describe('/api/notes/shared/:publicId (DELETE)', () => {
    it('should delete own public link', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/shared/${publicLink.publicId}`);

      testHelper.expectSuccess(response, 200);
      expect(response.body.message).toContain('Public link deleted successfully');
    });

    it('should fail to delete another user public link', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);
      
      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      const note = await testHelper.createNote(user1.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user1.token, note.id);

      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .delete(`/api/notes/shared/${publicLink.publicId}`);

      expect(response.status).toBe(400);
    });
  });
});