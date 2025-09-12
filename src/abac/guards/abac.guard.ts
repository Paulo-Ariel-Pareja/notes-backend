import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyEngineService } from '../policy-engine.service';
import {
  PolicyContext,
  PolicyAction,
  PolicyResource,
} from '../interfaces/policy.interface';
import { User } from '../../users/entities/user.entity';

export interface AbacMetadata {
  action: PolicyAction;
  resource: PolicyResource;
  resourceIdParam?: string;
  ownershipCheck?: boolean;
}

@Injectable()
export class AbacGuard implements CanActivate {
  private readonly logger = new Logger(AbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get ABAC metadata from decorator
    const abacMetadata = this.reflector.getAllAndOverride<AbacMetadata>(
      'abac',
      [context.getHandler(), context.getClass()],
    );

    if (!abacMetadata) {
      this.logger.warn('No ABAC metadata found, allowing access');
      return true; // No ABAC metadata means no restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      this.logger.warn('No user found in request, denying access');
      throw new ForbiddenException('Authentication required');
    }

    const policyContext: PolicyContext = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      action: abacMetadata.action,
      resourceType: abacMetadata.resource,
    };

    if (abacMetadata.resourceIdParam || abacMetadata.ownershipCheck) {
      policyContext.resource = await this.getResourceContext(
        request,
        abacMetadata,
        user,
      );
    }

    const isAllowed = await this.policyEngine.evaluate(policyContext);

    if (!isAllowed) {
      this.logger.warn(
        `Access denied for user ${user.id} to perform ${abacMetadata.action} on ${abacMetadata.resource}`,
      );
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    this.logger.debug(
      `Access granted for user ${user.id} to perform ${abacMetadata.action} on ${abacMetadata.resource}`,
    );
    return true;
  }

  private async getResourceContext(
    request: any,
    metadata: AbacMetadata,
    user: User,
  ): Promise<any> {
    const resourceContext: any = {};

    if (metadata.resourceIdParam) {
      const resourceId = request.params[metadata.resourceIdParam];
      if (resourceId) {
        resourceContext.id = resourceId;
      }
    }

    if (metadata.ownershipCheck) {
      resourceContext.ownerId = await this.getResourceOwnerId(request, user);
    }

    return resourceContext;
  }

  private getResourceOwnerId(request: any, user: User): string {
    if (request.body && request.body.ownerId) {
      return request.body.ownerId;
    }

    return user.id;
  }
}
