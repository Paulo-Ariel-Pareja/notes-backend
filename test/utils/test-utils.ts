import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/common/enums/user-role.enum';

export interface TestUser {
  id: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface TestNote {
  id: string;
  title: string;
  description: string;
  status: string;
  ownerId: string;
}

export interface TestPublicLink {
  id: string;
  publicId: string;
  noteId: string;
  createdById: string;
}

export class TestHelper {
  private app: INestApplication;
  private dataSource: DataSource;

  async setupApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    // Apply global configurations (same as main.ts)
    this.app.setGlobalPrefix('api');

    // Enable CORS for testing
    this.app.enableCors();

    await this.app.init();

    // Get database connection for cleanup
    this.dataSource = this.app.get(DataSource);

    return this.app;
  }

  async cleanDatabase(): Promise<void> {
    if (!this.dataSource) return;

    try {
      // Reset admin user cache
      this.adminUser = null;

      const entities = this.dataSource.entityMetadatas;

      // Clear all tables in reverse order to handle foreign keys
      const entityNames = entities.map((entity) => entity.tableName);

      // Disable foreign key checks for SQLite
      if (this.dataSource.options.type === 'sqlite') {
        await this.dataSource.query('PRAGMA foreign_keys = OFF');
      }

      // Clear all tables
      for (const tableName of entityNames) {
        await this.dataSource.query(`DELETE FROM "${tableName}"`);
      }

      // Re-enable foreign key checks for SQLite
      if (this.dataSource.options.type === 'sqlite') {
        await this.dataSource.query('PRAGMA foreign_keys = ON');
      }
    } catch (error) {
      console.warn('Error cleaning database:', error);
    }
  }

  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getApp(): INestApplication {
    return this.app;
  }

  // Authentication helpers
  async createUser(userData: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<TestUser> {
    // First, check if we need to create a super admin
    const isFirstUser = await this.isFirstUser();

    if (isFirstUser || userData.role === UserRole.ADMIN) {
      // Create user directly in database for first user or admin
      return await this.createUserDirectly(userData);
    }

    // For regular users, we need an admin to create them
    const admin = await this.ensureAdminExists();

    const response = await request(this.app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        email: userData.email,
        password: userData.password,
        role: userData.role || UserRole.USER,
      });

    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.body.message}`);
    }

    // Login to get token
    const loginResponse = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login user: ${loginResponse.body.message}`);
    }

    return {
      id: response.body.id,
      email: response.body.email,
      role: response.body.role,
      token: loginResponse.body.accessToken,
    };
  }

  private async isFirstUser(): Promise<boolean> {
    if (!this.dataSource) return true;

    try {
      const userRepository = this.dataSource.getRepository('User');
      const count = await userRepository.count();
      return count === 0;
    } catch (error) {
      return true;
    }
  }

  private async createUserDirectly(userData: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<TestUser> {
    // Import services to create user directly
    const bcrypt = require('bcrypt');
    const { randomUUID } = require('crypto');

    const hashedPassword = await bcrypt.hash(userData.password, 4);
    const userId = randomUUID();

    // Use repository to create user (works with both SQLite and PostgreSQL)
    const userRepository = this.dataSource.getRepository('User');
    await userRepository.save({
      id: userId,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Login to get token
    const loginResponse = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login user: ${loginResponse.body.message}`);
    }

    return {
      id: userId,
      email: userData.email,
      role: userData.role || UserRole.USER,
      token: loginResponse.body.accessToken,
    };
  }

  private adminUser: TestUser | null = null;

  private async ensureAdminExists(): Promise<TestUser> {
    if (this.adminUser) {
      return this.adminUser;
    }

    // Generate unique admin email to avoid conflicts
    const timestamp = Date.now();
    this.adminUser = await this.createUserDirectly({
      email: `admin${timestamp}@test.com`,
      password: 'admin123',
      role: UserRole.ADMIN,
    });

    return this.adminUser;
  }

  async loginUser(email: string, password: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Failed to login: ${response.body.message}`);
    }

    return response.body.accessToken;
  }

  // Note helpers
  async createNote(
    token: string,
    noteData: { title: string; description: string },
  ): Promise<TestNote> {
    const response = await request(this.app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(noteData);

    if (response.status !== 201) {
      throw new Error(`Failed to create note: ${response.body.message}`);
    }

    return response.body;
  }

  async createPublicLink(
    token: string,
    noteId: string,
    linkData?: { description?: string; expiresAt?: string },
  ): Promise<TestPublicLink> {
    const response = await request(this.app.getHttpServer())
      .post(`/api/notes/${noteId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send(linkData || {});

    if (response.status !== 201) {
      throw new Error(`Failed to create public link: ${response.body.message}`);
    }

    return response.body;
  }

  // Request helpers
  makeAuthenticatedRequest(token: string) {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer())
          .get(url)
          .set('Authorization', `Bearer ${token}`),
      post: (url: string) =>
        request(this.app.getHttpServer())
          .post(url)
          .set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        request(this.app.getHttpServer())
          .patch(url)
          .set('Authorization', `Bearer ${token}`),
      delete: (url: string) =>
        request(this.app.getHttpServer())
          .delete(url)
          .set('Authorization', `Bearer ${token}`),
    };
  }

  makePublicRequest() {
    return {
      get: (url: string) => request(this.app.getHttpServer()).get(url),
      post: (url: string) => request(this.app.getHttpServer()).post(url),
    };
  }

  // Assertion helpers
  expectValidationError(response: any, field?: string): void {
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
    if (field) {
      expect(response.body.message).toContain(field);
    }
  }

  expectUnauthorized(response: any): void {
    expect(response.status).toBe(401);
  }

  expectForbidden(response: any): void {
    expect(response.status).toBe(403);
  }

  expectNotFound(response: any): void {
    expect(response.status).toBe(404);
  }

  expectServerError(response: any): void {
    expect(response.status).toBe(500);
  }

  expectSuccess(response: any, expectedStatus: number = 200): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
  }

  // Data generators
  generateUserData(
    overrides?: Partial<{
      email: string;
      password: string;
      role: UserRole;
    }>,
  ) {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: UserRole.USER,
      ...overrides,
    };
  }

  generateNoteData(
    overrides?: Partial<{
      title: string;
      description: string;
    }>,
  ) {
    const timestamp = Date.now();
    return {
      title: `Test Note ${timestamp}`,
      description: `This is a test note created at ${new Date().toISOString()}`,
      ...overrides,
    };
  }

  generatePublicLinkData(
    overrides?: Partial<{
      description: string;
      expiresAt: string;
    }>,
  ) {
    return {
      description: 'Test public link',
      ...overrides,
    };
  }
}
