import { Injectable, Logger } from '@nestjs/common';
import {
  Policy,
  PolicyContext,
  PolicyCondition,
  ConditionOperator,
  PolicyAction,
  PolicyResource,
} from './interfaces/policy.interface';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);
  private policies: Policy[] = [];

  constructor() {
    this.initializePolicies();
  }

  async evaluate(context: PolicyContext): Promise<boolean> {
    this.logger.debug(
      `Evaluating policy for action: ${context.action} on resource: ${context.resourceType}`,
    );

    // Find applicable policies
    const applicablePolicies = this.findApplicablePolicies(context);

    if (applicablePolicies.length === 0) {
      this.logger.warn(
        `No policies found for action: ${context.action} on resource: ${context.resourceType}`,
      );
      return false; // Deny by default if no policies match
    }

    // Evaluate each policy
    for (const policy of applicablePolicies) {
      const result = await this.evaluatePolicy(policy, context);

      if (policy.effect === 'deny' && result) {
        this.logger.debug(`Policy ${policy.name} denied access`);
        return false; // Explicit deny takes precedence
      }

      if (policy.effect === 'allow' && result) {
        this.logger.debug(`Policy ${policy.name} allowed access`);
        return true; // Allow access
      }
    }

    this.logger.debug('No matching allow policies found, denying access');
    return false; // Deny by default
  }

  private findApplicablePolicies(context: PolicyContext): Policy[] {
    return this.policies.filter(
      (policy) =>
        policy.resource === context.resourceType &&
        policy.action === context.action,
    );
  }

  private async evaluatePolicy(
    policy: Policy,
    context: PolicyContext,
  ): Promise<boolean> {
    for (const condition of policy.conditions) {
      if (!(await this.evaluateCondition(condition, context))) {
        return false; // All conditions must be true
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: PolicyCondition,
    context: PolicyContext,
  ): boolean {
    const actualValue = this.getAttributeValue(condition.attribute, context);
    let expectedValue = condition.value;
    console.log('Evaluating condition:', {
      condition,
      actualValue,
      expectedValue,
    });

    // If expectedValue is a string that looks like an attribute reference, resolve it
    if (typeof expectedValue === 'string' && expectedValue.includes('.')) {
      const resolvedValue = this.getAttributeValue(expectedValue, context);
      if (resolvedValue !== undefined) {
        expectedValue = resolvedValue;
      }
    }

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return actualValue === expectedValue;

      case ConditionOperator.NOT_EQUALS:
        return actualValue !== expectedValue;

      case ConditionOperator.IN:
        return (
          Array.isArray(expectedValue) && expectedValue.includes(actualValue)
        );

      case ConditionOperator.NOT_IN:
        return (
          Array.isArray(expectedValue) && !expectedValue.includes(actualValue)
        );

      case ConditionOperator.CONTAINS:
        return (
          typeof actualValue === 'string' && actualValue.includes(expectedValue)
        );

      case ConditionOperator.EXISTS:
        return actualValue !== undefined && actualValue !== null;

      default:
        this.logger.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  private getAttributeValue(attribute: string, context: PolicyContext): any {
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private initializePolicies(): void {
    this.policies = [
      // User creation - Admin only
      {
        id: 'user-create-admin',
        name: 'Allow admin to create users',
        resource: PolicyResource.USER,
        action: PolicyAction.CREATE,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.ADMIN,
          },
        ],
        effect: 'allow',
      },

      // Note creation - Any authenticated user
      {
        id: 'note-create-user',
        name: 'Allow users to create notes',
        resource: PolicyResource.NOTE,
        action: PolicyAction.CREATE,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.IN,
            value: [UserRole.USER, UserRole.ADMIN],
          },
        ],
        effect: 'allow',
      },

      // Note read - Owner only
      {
        id: 'note-read-owner',
        name: 'Allow users to read their own notes',
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
      },

      // Note update - Owner only
      {
        id: 'note-update-owner',
        name: 'Allow users to update their own notes',
        resource: PolicyResource.NOTE,
        action: PolicyAction.UPDATE,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
        ],
        effect: 'allow',
      },

      // Note delete - Owner only
      {
        id: 'note-delete-owner',
        name: 'Allow users to delete their own notes',
        resource: PolicyResource.NOTE,
        action: PolicyAction.DELETE,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
        ],
        effect: 'allow',
      },

      // Note share - Owner only (not admin)
      {
        id: 'note-share-owner',
        name: 'Allow users to share their own notes',
        resource: PolicyResource.NOTE,
        action: PolicyAction.SHARE,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: [UserRole.USER, UserRole.ADMIN],
          },
        ],
        effect: 'allow',
      },

      // Admin notes view - Admin only
      {
        id: 'admin-notes-list',
        name: 'Allow admin to list all active notes',
        resource: PolicyResource.ADMIN_NOTES,
        action: PolicyAction.LIST,
        conditions: [
          {
            attribute: 'user.role',
            operator: ConditionOperator.EQUALS,
            value: UserRole.ADMIN,
          },
        ],
        effect: 'allow',
      },

      // Public link management - Owner only
      {
        id: 'public-link-create-owner',
        name: 'Allow users to create public links for their notes',
        resource: PolicyResource.PUBLIC_LINK,
        action: PolicyAction.CREATE,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
        ],
        effect: 'allow',
      },

      {
        id: 'public-link-delete-owner',
        name: 'Allow users to delete their public links',
        resource: PolicyResource.PUBLIC_LINK,
        action: PolicyAction.DELETE,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
        ],
        effect: 'allow',
      },

      {
        id: 'public-link-list-owner',
        name: 'Allow users to list their public links',
        resource: PolicyResource.PUBLIC_LINK,
        action: PolicyAction.LIST,
        conditions: [
          {
            attribute: 'user.id',
            operator: ConditionOperator.EQUALS,
            value: 'resource.ownerId',
          },
        ],
        effect: 'allow',
      },
    ];

    this.logger.log(`Initialized ${this.policies.length} policies`);
  }

  addPolicy(policy: Policy): void {
    this.policies.push(policy);
    this.logger.log(`Added policy: ${policy.name}`);
  }

  removePolicy(policyId: string): void {
    const index = this.policies.findIndex((p) => p.id === policyId);
    if (index !== -1) {
      const removed = this.policies.splice(index, 1)[0];
      this.logger.log(`Removed policy: ${removed.name}`);
    }
  }

  getAllPolicies(): Policy[] {
    return [...this.policies];
  }
}
