import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for authentication and authorization exceptions
 */
export abstract class AuthException extends HttpException {
  constructor(message: string, statusCode: HttpStatus) {
    super(message, statusCode);
  }
}

/**
 * Exception thrown when authentication credentials are invalid
 */
export class InvalidCredentialsException extends AuthException {
  constructor() {
    super('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception thrown when JWT token is invalid or expired
 */
export class InvalidTokenException extends AuthException {
  constructor(message: string = 'Invalid or expired token') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception thrown when JWT token is missing
 */
export class MissingTokenException extends AuthException {
  constructor() {
    super('Authentication token is required', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception thrown when user account is disabled or inactive
 */
export class AccountDisabledException extends AuthException {
  constructor() {
    super('Account is disabled', HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when user tries to access a resource without proper authorization
 */
export class UnauthorizedAccessException extends AuthException {
  constructor(resource?: string) {
    const message = resource
      ? `Unauthorized access to ${resource}`
      : 'Unauthorized access';
    super(message, HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when ABAC policy evaluation fails
 */
export class PolicyViolationException extends AuthException {
  constructor(action: string, resource: string) {
    super(
      `Access denied: Cannot perform '${action}' on '${resource}'`,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Exception thrown when user role is insufficient for the operation
 */
export class InsufficientRoleException extends AuthException {
  constructor(requiredRole: string) {
    super(
      `Access denied: '${requiredRole}' role required`,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Exception thrown when session has expired
 */
export class SessionExpiredException extends AuthException {
  constructor() {
    super('Session has expired, please login again', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception thrown when too many authentication attempts are made
 */
export class TooManyAttemptsException extends AuthException {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many attempts. Please try again in ${retryAfter} seconds`
      : 'Too many attempts. Please try again later';
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
