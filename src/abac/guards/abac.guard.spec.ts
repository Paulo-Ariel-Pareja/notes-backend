import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbacGuard, AbacMetadata } from './abac.guard';
import { PolicyEngineService } from '../policy-engine.service';
import { PolicyAction, PolicyResource } from '../interfaces/policy.interface';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AbacGuard', () => {
  let guard: AbacGuard;
  let reflector: Reflector;
  let policyEngine: PolicyEngineService;

  const mockUser: User = {
    id: 'user-id',
    email: 'user@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [],
    publicLinks: [],
    isAdmin: () => false,
    isUser: () => true,
    getDisplayName: () => 'user@example.com',
    getPublicLinks: () => [],
    getActivePublicLinks: () => [],
    getPublicLinkCount: () => 0,
    hasPublicLinks: () => false,
  } as User;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPolicyEngine = {
    evaluate: jest.fn(),
  };

  const createMockExecutionContext = (
    user: User | null = mockUser,
    params: any = {},
    body: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbacGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PolicyEngineService,
          useValue: mockPolicyEngine,
        },
      ],
    }).compile();

    guard = module.get<AbacGuard>(AbacGuard);
    reflector = module.get<Reflector>(Reflector);
    policyEngine = module.get<PolicyEngineService>(PolicyEngineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no ABAC metadata is present', async () => {
      const context = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('abac', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw ForbiddenException when no user is present', async () => {
      const context = createMockExecutionContext(null);
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.READ,
        resource: PolicyResource.NOTE,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access when policy evaluation returns true', async () => {
      const context = createMockExecutionContext();
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.CREATE,
        resource: PolicyResource.NOTE,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(policyEngine.evaluate).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        action: PolicyAction.CREATE,
        resourceType: PolicyResource.NOTE,
      });
    });

    it('should throw ForbiddenException when policy evaluation returns false', async () => {
      const context = createMockExecutionContext();
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.CREATE,
        resource: PolicyResource.USER,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should include resource ID when resourceIdParam is specified', async () => {
      const context = createMockExecutionContext(mockUser, {
        noteId: 'note-123',
      });
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.READ,
        resource: PolicyResource.NOTE,
        resourceIdParam: 'noteId',
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(policyEngine.evaluate).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
        resource: {
          id: 'note-123',
        },
      });
    });

    it('should include ownership information when ownershipCheck is true', async () => {
      const context = createMockExecutionContext();
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.CREATE,
        resource: PolicyResource.NOTE,
        ownershipCheck: true,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(policyEngine.evaluate).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        action: PolicyAction.CREATE,
        resourceType: PolicyResource.NOTE,
        resource: {
          ownerId: mockUser.id, // For CREATE actions, user is the owner
        },
      });
    });

    it('should use ownerId from request body when available', async () => {
      const context = createMockExecutionContext(
        mockUser,
        {},
        { ownerId: 'other-user-id' },
      );
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.UPDATE,
        resource: PolicyResource.NOTE,
        ownershipCheck: true,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(policyEngine.evaluate).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        action: PolicyAction.UPDATE,
        resourceType: PolicyResource.NOTE,
        resource: {
          ownerId: 'other-user-id',
        },
      });
    });

    it('should handle both resourceIdParam and ownershipCheck together', async () => {
      const context = createMockExecutionContext(
        mockUser,
        { id: 'resource-123' },
        { ownerId: 'owner-id' },
      );
      const abacMetadata: AbacMetadata = {
        action: PolicyAction.UPDATE,
        resource: PolicyResource.NOTE,
        resourceIdParam: 'id',
        ownershipCheck: true,
      };
      mockReflector.getAllAndOverride.mockReturnValue(abacMetadata);
      mockPolicyEngine.evaluate.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(policyEngine.evaluate).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        action: PolicyAction.UPDATE,
        resourceType: PolicyResource.NOTE,
        resource: {
          id: 'resource-123',
          ownerId: 'owner-id',
        },
      });
    });
  });
});
