import { INestApplication } from '@nestjs/common';
import { TestHelper } from './utils/test-utils';
import { UserRole } from '../src/common/enums/user-role.enum';
import { NoteStatus } from '../src/common/enums/note-status.enum';

describe('Notes (e2e)', () => {
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

  describe('/api/notes (POST)', () => {
    it('should create note as authenticated user', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const noteData = testHelper.generateNoteData();
      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send(noteData);

      testHelper.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(noteData.title);
      expect(response.body.description).toBe(noteData.description);
      expect(response.body.status).toBe(NoteStatus.ACTIVE);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create note as admin', async () => {
      const adminData = testHelper.generateUserData({ role: UserRole.ADMIN });
      const admin = await testHelper.createUser(adminData);

      const noteData = testHelper.generateNoteData();
      const response = await testHelper
        .makeAuthenticatedRequest(admin.token)
        .post('/api/notes')
        .send(noteData);

      testHelper.expectSuccess(response, 201);
    });

    it('should fail to create note without authentication', async () => {
      const noteData = testHelper.generateNoteData();
      const response = await testHelper
        .makePublicRequest()
        .post('/api/notes')
        .send(noteData);

      testHelper.expectUnauthorized(response);
    });

    // edge case, decorator should catch these
    it('should fail with missing title', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send({
          description: 'Test description',
        });

      testHelper.expectServerError(response);
    });

    // edge case, decorator should catch these
    it('should fail with missing description', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .post('/api/notes')
        .send({
          title: 'Test title',
        });

      testHelper.expectServerError(response);
    });
  });

  describe('/api/notes (GET)', () => {
    it('should get user notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note1 = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );
      const note2 = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('notes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');

      const { notes } = response.body as { notes: any[] };
      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBe(2);
      expect(notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: note1.id,
            title: note1.title,
            description: note1.description,
          }),
          expect.objectContaining({
            id: note2.id,
            title: note2.title,
            description: note2.description,
          }),
        ]),
      );
    });

    it('should not see other users notes', async () => {
      const userData1 = testHelper.generateUserData();
      const user1 = await testHelper.createUser(userData1);

      const userData2 = testHelper.generateUserData();
      const user2 = await testHelper.createUser(userData2);

      // User1 creates notes
      await testHelper.createNote(user1.token, testHelper.generateNoteData());
      await testHelper.createNote(user1.token, testHelper.generateNoteData());

      // User2 should not see user1's notes
      const response = await testHelper
        .makeAuthenticatedRequest(user2.token)
        .get('/api/notes');

      testHelper.expectSuccess(response, 200);
      expect(response.body.notes.length).toBe(0);
    });

    it('should support pagination', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create multiple notes
      for (let i = 0; i < 5; i++) {
        await testHelper.createNote(user.token, testHelper.generateNoteData());
      }

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes?page=1&limit=2');

      testHelper.expectSuccess(response, 200);
      expect(response.body.notes.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe('1');
    });

    it('should support search', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      await testHelper.createNote(user.token, {
        title: 'Important Meeting Notes',
        description: 'Meeting with client about project requirements',
      });

      await testHelper.createNote(user.token, {
        title: 'Shopping List',
        description: 'Groceries for the week',
      });

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes?search=meeting');

      testHelper.expectSuccess(response, 200);
      expect(response.body.notes.length).toBe(1);
      expect(response.body.notes[0].title).toContain('Meeting');
    });

    it('should filter by status', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      // Update note status to disabled
      await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note.id}`)
        .send({ status: NoteStatus.DISABLED });

      // Get only active notes
      const activeResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes?status=active');

      testHelper.expectSuccess(activeResponse, 200);
      expect(activeResponse.body.notes.length).toBe(0);

      // Get disabled notes
      const disabledResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes?status=disabled');

      testHelper.expectSuccess(disabledResponse, 200);
      expect(disabledResponse.body.notes.length).toBe(1);
    });
  });

  describe('/api/notes/stats (GET)', () => {
    it('should get user note statistics', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create notes with different statuses
      const note1 = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );
      await testHelper.createNote(user.token, testHelper.generateNoteData());

      // Disable one note
      await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note1.id}`)
        .send({ status: NoteStatus.DISABLED });

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/stats');

      testHelper.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('totalNotes', 2);
      expect(response.body).toHaveProperty('activeNotes', 1);
      expect(response.body).toHaveProperty('disabledNotes', 1);
      expect(response.body).toHaveProperty('sharedNotes');
      expect(response.body).toHaveProperty('totalViews');
    });
  });

  describe('/api/notes/recent (GET)', () => {
    it('should get recent notes', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      // Create multiple notes
      for (let i = 0; i < 3; i++) {
        await testHelper.createNote(user.token, testHelper.generateNoteData());
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/recent?limit=2');

      testHelper.expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('/api/notes/:id (GET)', () => {
    it('should get own note by id', async () => {
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
      expect(response.body.id).toBe(note.id);
      expect(response.body.title).toBe(note.title);
    });

    it('should fail to get another user note', async () => {
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

    it('should fail with non-existent note id', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get('/api/notes/52b09b9f-1e04-470f-896a-ddca9acadc0e');

      testHelper.expectNotFound(response);
    });
  });

  describe('/api/notes/:id (PATCH)', () => {
    it('should update own note', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: NoteStatus.DISABLED,
      };

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note.id}`)
        .send(updateData);

      testHelper.expectSuccess(response, 200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should update partial note data', async () => {
      const userData = testHelper.generateUserData();
      const user = await testHelper.createUser(userData);

      const note = await testHelper.createNote(
        user.token,
        testHelper.generateNoteData(),
      );

      const response = await testHelper
        .makeAuthenticatedRequest(user.token)
        .patch(`/api/notes/${note.id}`)
        .send({ title: 'Only Title Updated' });

      testHelper.expectSuccess(response, 200);
      expect(response.body.title).toBe('Only Title Updated');
      expect(response.body.description).toBe(note.description); // Should remain unchanged
    });

    it('should fail to update another user note', async () => {
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
        .send({ title: 'Hacked!' });

      testHelper.expectNotFound(response);
    });
  });

  describe('/api/notes/:id (DELETE)', () => {
    it('should delete own note', async () => {
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
      expect(response.body.message).toContain('Note deleted successfully');

      // Verify note is deleted
      const getResponse = await testHelper
        .makeAuthenticatedRequest(user.token)
        .get(`/api/notes/${note.id}`);

      testHelper.expectNotFound(getResponse);
    });

    it('should not fail to delete another user note', async () => {
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
});
