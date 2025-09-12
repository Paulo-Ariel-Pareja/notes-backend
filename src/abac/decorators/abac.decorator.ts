import { SetMetadata } from '@nestjs/common';
import { PolicyAction, PolicyResource } from '../interfaces/policy.interface';

export interface AbacOptions {
  action: PolicyAction;
  resource: PolicyResource;
  resourceIdParam?: string;
  ownershipCheck?: boolean;
}

export const ABAC_KEY = 'abac';

export const RequireAbac = (options: AbacOptions) =>
  SetMetadata(ABAC_KEY, options);

// User management
export const RequireAdminRole = () =>
  RequireAbac({
    action: PolicyAction.CREATE,
    resource: PolicyResource.USER,
  });

// Note operations
export const RequireNoteOwnership = (
  action: PolicyAction,
  resourceIdParam: string = 'id',
) =>
  RequireAbac({
    action,
    resource: PolicyResource.NOTE,
    resourceIdParam,
    ownershipCheck: true,
  });

export const RequireNoteCreate = () =>
  RequireAbac({
    action: PolicyAction.CREATE,
    resource: PolicyResource.NOTE,
    ownershipCheck: true,
  });

export const RequireNoteRead = (resourceIdParam: string = 'id') =>
  RequireNoteOwnership(PolicyAction.READ, resourceIdParam);

export const RequireNoteUpdate = (resourceIdParam: string = 'id') =>
  RequireNoteOwnership(PolicyAction.UPDATE, resourceIdParam);

export const RequireNoteDelete = (resourceIdParam: string = 'id') =>
  RequireNoteOwnership(PolicyAction.DELETE, resourceIdParam);

export const RequireNoteShare = (resourceIdParam: string = 'id') =>
  RequireNoteOwnership(PolicyAction.SHARE, resourceIdParam);

// Public link operations
export const RequirePublicLinkOwnership = (action: PolicyAction) =>
  RequireAbac({
    action,
    resource: PolicyResource.PUBLIC_LINK,
    ownershipCheck: true,
  });

export const RequirePublicLinkCreate = () =>
  RequirePublicLinkOwnership(PolicyAction.CREATE);

export const RequirePublicLinkDelete = () =>
  RequirePublicLinkOwnership(PolicyAction.DELETE);

export const RequirePublicLinkList = () =>
  RequirePublicLinkOwnership(PolicyAction.LIST);
