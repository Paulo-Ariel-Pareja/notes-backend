import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';

describe('Public Access (e2e)', () => {
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

  describe('/api/public/notes/:publicId (GET)', () => {
    it('should access public note without authentication', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const noteData = testHelper.generateNoteData({
        title: 'Public Note',
        description: 'This is a publicly shared note',
      });
      const note = await testHelper.createNote(user.token, noteData);
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectSuccess(response, 200);
      expect(response.body.id).toBe(note.id);
      expect(response.body.title).toBe(noteData.title);
      expect(response.body.description).toBe(noteData.description);
      expect(response.body).toHaveProperty('owner');
      expect(response.body.owner.email).toBe(user.email);
      expect(response.body.owner).not.toHaveProperty('password');
    });

    it('should increment view count on access', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // Access the public note multiple times
      await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);
      
      await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      // Check if view count increased
      const linksResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/shared');

      testHelper.expectSuccess(linksResponse, 200);
      const link = linksResponse.body.links.find((l: any) => l.publicId === publicLink.publicId);
      expect(link.viewCount).toBeGreaterThan(0);
    });

    it('should fail with non-existent public id', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/public/notes/non-existent-id');

      testHelper.expectNotFound(response);
      expect(response.body.message).toContain('Note not found or no longer available');
    });

    it('should fail with expired public link', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      
      // Create expired link
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const publicLink = await testHelper.createPublicLink(user.token, note.id, {
        expiresAt: pastDate.toISOString(),
      });

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectNotFound(response);
    });

    it('should fail when note is disabled', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // Disable the note
      await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note.id}`)
        .send({ status: 'disabled' });

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectNotFound(response);
    });

    it('should fail when public link is deleted', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // Delete the public link
      await testHelper
        .makeAuthenticatedRequest(user.token)
        .delete(`/api/notes/shared/${publicLink.publicId}`);

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectNotFound(response);
    });

    it('should handle malformed public id gracefully', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/public/notes/malformed-id-with-special-chars-!@#$%');

      expect(response.status).toBe(400);
    });

    it('should return note with computed properties', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const noteData = testHelper.generateNoteData({
        description: 'This is a test note with multiple words to test word count functionality',
      });
      const note = await testHelper.createNote(user.token, noteData);
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('wordCount');
      expect(response.body).toHaveProperty('characterCount');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('isPubliclyShared');
      expect(response.body).toHaveProperty('totalViews');
      
      expect(response.body.wordCount).toBeGreaterThan(0);
      expect(response.body.characterCount).toBe(noteData.description.length);
      expect(response.body.isPubliclyShared).toBe(true);
    });
  });

  describe('/api/public/health (GET)', () => {
    it('should return health status without authentication', async () => {
      const response = await testHelper
        .makePublicRequest()
        .get('/api/public/health');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'notes-backend-public');
    });
  });

  describe('Public Link Security', () => {
    it('should not expose sensitive user information', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${publicLink.publicId}`);

      testHelper.expectSuccess(response, 200);
      
      // Check that sensitive information is not exposed
      expect(response.body.owner).not.toHaveProperty('password');
      expect(response.body.owner).not.toHaveProperty('id');
      expect(response.body.owner).not.toHaveProperty('role');
      expect(response.body.owner).not.toHaveProperty('createdAt');
      expect(response.body.owner).not.toHaveProperty('updatedAt');
      
      // Should only have email
      expect(response.body.owner).toHaveProperty('email');
    });

    it('should not allow access to private note data through public endpoint', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      
      // Try to access note directly by ID (not through public link)
      const response = await testHelper
        .makePublicRequest()
        .get(`/api/public/notes/${note.id}`);

      testHelper.expectNotFound(response);
    });

    it('should handle concurrent access correctly', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(user.token, testHelper.generateNoteData());
      const publicLink = await testHelper.createPublicLink(user.token, note.id);

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        testHelper
          .makePublicRequest()
          .get(`/api/public/notes/${publicLink.publicId}`)
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        testHelper.expectSuccess(response, 200);
        expect(response.body.id).toBe(note.id);
      });
    });
  });
});