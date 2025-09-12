import { UserRole } from '../../common/enums/user-role.enum';

export enum PolicyAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SHARE = 'share',
  LIST = 'list',
}

export enum PolicyResource {
  USER = 'user',
  NOTE = 'note',
  PUBLIC_LINK = 'public_link',
  ADMIN_NOTES = 'admin_notes',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  EXISTS = 'exists',
}

export interface PolicyCondition {
  attribute: string;
  operator: ConditionOperator;
  value: any;
}

export interface Policy {
  id: string;
  name: string;
  resource: PolicyResource;
  action: PolicyAction;
  conditions: PolicyCondition[];
  effect: 'allow' | 'deny';
}

export interface PolicyContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  resource?: {
    id?: string;
    ownerId?: string;
    status?: string;
    [key: string]: any;
  };
  action: PolicyAction;
  resourceType: PolicyResource;
}
