import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PolicyEngineService } from './policy-engine.service';
import {
  PolicyContext,
  PolicyAction,
  PolicyResource,
  ConditionOperator,
  Policy,
} from './interfaces/policy.interface';
import { UserRole } from '../common/enums/user-role.enum';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyEngineService],
    }).compile();

    service = module.get<PolicyEngineService>(PolicyEngineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize policies on construction', () => {
      const policies = service.getAllPolicies();
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialized'),
      );
    });
  });

  describe('evaluate', () => {
    describe('User creation policies', () => {
      it('should allow admin to create users', async () => {
        const context: PolicyContext = {
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            role: UserRole.ADMIN,
          },
          action: PolicyAction.CREATE,
          resourceType: PolicyResource.USER,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should deny regular user from creating users', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.CREATE,
          resourceType: PolicyResource.USER,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(false);
      });
    });

    describe('Note creation policies', () => {
      it('should allow regular user to create notes', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.CREATE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should allow admin to create notes', async () => {
        const context: PolicyContext = {
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            role: UserRole.ADMIN,
          },
          action: PolicyAction.CREATE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('Note ownership policies', () => {
      it('should allow user to read their own note', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it("should deny user from reading another user's note", async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-2',
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(false);
      });

      it('should allow user to update their own note', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.UPDATE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should allow user to delete their own note', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.DELETE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('Note sharing policies', () => {
      it('should allow regular user to share their own note', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.SHARE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should allow admin from sharing notes', async () => {
        const context: PolicyContext = {
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            role: UserRole.ADMIN,
          },
          resource: {
            id: 'note-1',
            ownerId: 'admin-1',
          },
          action: PolicyAction.SHARE,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('Admin notes policies', () => {
      it('should allow admin to list all notes', async () => {
        const context: PolicyContext = {
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            role: UserRole.ADMIN,
          },
          action: PolicyAction.LIST,
          resourceType: PolicyResource.ADMIN_NOTES,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should deny regular user from listing all notes', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.LIST,
          resourceType: PolicyResource.ADMIN_NOTES,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(false);
      });
    });

    describe('Public link policies', () => {
      it('should allow user to create public link for their note', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.CREATE,
          resourceType: PolicyResource.PUBLIC_LINK,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should allow user to delete their public link', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'link-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.DELETE,
          resourceType: PolicyResource.PUBLIC_LINK,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should allow user to list their public links', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            ownerId: 'user-1',
          },
          action: PolicyAction.LIST,
          resourceType: PolicyResource.PUBLIC_LINK,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('No matching policies', () => {
      it('should deny access when no policies match', async () => {
        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.CREATE,
          resourceType: 'unknown_resource' as PolicyResource,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(false);
      });
    });
  });
  describe('Condition evaluation', () => {
    describe('EQUALS operator', () => {
      it('should evaluate equals condition correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-equals',
          name: 'Test equals condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.role',
              operator: ConditionOperator.EQUALS,
              value: UserRole.USER,
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('NOT_EQUALS operator', () => {
      it('should evaluate not equals condition correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-not-equals',
          name: 'Test not equals condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.role',
              operator: ConditionOperator.NOT_EQUALS,
              value: UserRole.ADMIN,
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('IN operator', () => {
      it('should evaluate in condition correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-in',
          name: 'Test in condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.role',
              operator: ConditionOperator.IN,
              value: [UserRole.USER, UserRole.ADMIN],
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('NOT_IN operator', () => {
      it('should evaluate not in condition correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-not-in',
          name: 'Test not in condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.role',
              operator: ConditionOperator.NOT_IN,
              value: [UserRole.ADMIN],
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('CONTAINS operator', () => {
      it('should evaluate contains condition correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-contains',
          name: 'Test contains condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.email',
              operator: ConditionOperator.CONTAINS,
              value: '@test.com',
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });

    describe('EXISTS operator', () => {
      it('should evaluate exists condition correctly when attribute exists', async () => {
        const testPolicy: Policy = {
          id: 'test-exists',
          name: 'Test exists condition',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.id',
              operator: ConditionOperator.EXISTS,
              value: true,
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should evaluate exists condition correctly when attribute does not exist', async () => {
        const testPolicy: Policy = {
          id: 'test-exists-false',
          name: 'Test exists condition false',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.nonexistent',
              operator: ConditionOperator.EXISTS,
              value: true,
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(false);
      });
    });

    describe('Attribute resolution', () => {
      it('should resolve nested attributes correctly', async () => {
        const testPolicy: Policy = {
          id: 'test-nested',
          name: 'Test nested attribute',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'resource.status',
              operator: ConditionOperator.EQUALS,
              value: 'active',
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            status: 'active',
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });

      it('should handle attribute reference resolution', async () => {
        const testPolicy: Policy = {
          id: 'test-reference',
          name: 'Test attribute reference',
          resource: PolicyResource.NOTE,
          action: PolicyAction.READ,
          conditions: [
            {
              attribute: 'user.id',
              operator: ConditionOperator.EQUALS,
              value: 'resource.ownerId',
            },
          ],
          effect: 'allow',
        };

        service.addPolicy(testPolicy);

        const context: PolicyContext = {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: UserRole.USER,
          },
          resource: {
            id: 'note-1',
            ownerId: 'user-1',
          },
          action: PolicyAction.READ,
          resourceType: PolicyResource.NOTE,
        };

        const result = await service.evaluate(context);
        expect(result).toBe(true);
      });
    });
  });

  describe('Deny policies', () => {
    it('should deny access when explicit deny policy matches', async () => {
      const denyPolicy: Policy = {
        id: 'test-deny',
        name: 'Test deny policy',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.USER,
          },
        ],
        effect: 'deny',
      };

      service.addPolicy(denyPolicy);

      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(false);
    });

    it('should prioritize deny over allow policies when deny is added first', async () => {
      const denyPolicy: Policy = {
        id: 'test-deny-priority',
        name: 'Test deny priority policy',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.email',
            operator: ConditionOperator.CONTAINS,
            value: '@test.com',
          },
        ],
        effect: 'deny',
      };

      const allowPolicy: Policy = {
        id: 'test-allow',
        name: 'Test allow policy',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.USER,
          },
        ],
        effect: 'allow',
      };

      // Add deny policy first so it gets evaluated first
      service.addPolicy(denyPolicy);
      service.addPolicy(allowPolicy);

      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(false);
    });
  });

  describe('Policy management', () => {
    it('should add policy correctly', () => {
      const initialCount = service.getAllPolicies().length;

      const newPolicy: Policy = {
        id: 'test-add',
        name: 'Test add policy',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [],
        effect: 'allow',
      };

      service.addPolicy(newPolicy);

      const finalCount = service.getAllPolicies().length;
      expect(finalCount).toBe(initialCount + 1);

      const addedPolicy = service
        .getAllPolicies()
        .find((p) => p.id === 'test-add');
      expect(addedPolicy).toBeDefined();
      expect(addedPolicy?.name).toBe('Test add policy');
    });

    it('should remove policy correctly', () => {
      const testPolicy: Policy = {
        id: 'test-remove',
        name: 'Test remove policy',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [],
        effect: 'allow',
      };

      service.addPolicy(testPolicy);
      const countAfterAdd = service.getAllPolicies().length;

      service.removePolicy('test-remove');
      const countAfterRemove = service.getAllPolicies().length;

      expect(countAfterRemove).toBe(countAfterAdd - 1);

      const removedPolicy = service
        .getAllPolicies()
        .find((p) => p.id === 'test-remove');
      expect(removedPolicy).toBeUndefined();
    });

    it('should handle removing non-existent policy gracefully', () => {
      const initialCount = service.getAllPolicies().length;

      service.removePolicy('non-existent-policy');

      const finalCount = service.getAllPolicies().length;
      expect(finalCount).toBe(initialCount);
    });

    it('should return all policies', () => {
      const policies = service.getAllPolicies();
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);

      // Verify it returns a copy, not the original array
      const originalLength = policies.length;
      policies.push({
        id: 'test',
        name: 'test',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [],
        effect: 'allow',
      });

      const newPolicies = service.getAllPolicies();
      expect(newPolicies.length).toBe(originalLength);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing resource in context', async () => {
      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(false);
    });

    it('should handle unknown condition operator', async () => {
      const testPolicy: Policy = {
        id: 'test-unknown-operator',
        name: 'Test unknown operator',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.role',
            operator: 'unknown' as ConditionOperator,
            value: UserRole.USER,
          },
        ],
        effect: 'allow',
      };

      service.addPolicy(testPolicy);

      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(false);
    });

    it('should handle multiple conditions (all must be true)', async () => {
      const testPolicy: Policy = {
        id: 'test-multiple-conditions',
        name: 'Test multiple conditions',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.USER,
          },
          {
            attribute: 'user.email',
            operator: ConditionOperator.CONTAINS,
            value: '@test.com',
          },
        ],
        effect: 'allow',
      };

      service.addPolicy(testPolicy);

      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(true);
    });

    it('should fail when one condition fails in multiple conditions', async () => {
      const testPolicy: Policy = {
        id: 'test-multiple-conditions-fail',
        name: 'Test multiple conditions fail',
        resource: PolicyResource.NOTE,
        action: PolicyAction.READ,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.USER,
          },
          {
            attribute: 'user.email',
            operator: ConditionOperator.CONTAINS,
            value: '@admin.com',
          },
        ],
        effect: 'allow',
      };

      service.addPolicy(testPolicy);

      const context: PolicyContext = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: UserRole.USER,
        },
        action: PolicyAction.READ,
        resourceType: PolicyResource.NOTE,
      };

      const result = await service.evaluate(context);
      expect(result).toBe(false);
    });
  });
});
