import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for business logic exceptions
 */
export abstract class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * Exception thrown when a user tries to access a resource they don't own
 */
export class ResourceOwnershipException extends BusinessException {
  constructor(resourceType: string = 'resource') {
    super(`You do not have permission to access this ${resourceType}`, HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when a note is not found
 */
export class NoteNotFoundException extends BusinessException {
  constructor(noteId?: string) {
    const message = noteId 
      ? `Note with ID '${noteId}' not found` 
      : 'Note not found';
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when a user is not found
 */
export class UserNotFoundException extends BusinessException {
  constructor(identifier?: string) {
    const message = identifier 
      ? `User with identifier '${identifier}' not found` 
      : 'User not found';
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when a public link is not found
 */
export class PublicLinkNotFoundException extends BusinessException {
  constructor(publicId?: string) {
    const message = publicId 
      ? `Public link with ID '${publicId}' not found` 
      : 'Public link not found';
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when trying to access an inactive/disabled note
 */
export class NoteInactiveException extends BusinessException {
  constructor() {
    super('This note is no longer available', HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when a public link has expired
 */
export class PublicLinkExpiredException extends BusinessException {
  constructor() {
    super('This shared link has expired', HttpStatus.GONE);
  }
}

/**
 * Exception thrown when trying to share an inactive note
 */
export class CannotShareInactiveNoteException extends BusinessException {
  constructor() {
    super('Cannot share a disabled note', HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when password validation fails
 */
export class InvalidPasswordException extends BusinessException {
  constructor(message: string = 'Invalid password') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when current password is incorrect during password change
 */
export class IncorrectCurrentPasswordException extends BusinessException {
  constructor() {
    super('Current password is incorrect', HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when email already exists
 */
export class EmailAlreadyExistsException extends BusinessException {
  constructor(email?: string) {
    const message = email 
      ? `Email '${email}' is already registered` 
      : 'Email is already registered';
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * Exception thrown when trying to perform admin-only operations
 */
export class InsufficientPermissionsException extends BusinessException {
  constructor(operation?: string) {
    const message = operation 
      ? `Insufficient permissions to perform '${operation}'` 
      : 'Insufficient permissions';
    super(message, HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when validation fails for business rules
 */
export class BusinessValidationException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when a resource limit is exceeded
 */
export class ResourceLimitExceededException extends BusinessException {
  constructor(resourceType: string, limit: number) {
    super(`${resourceType} limit of ${limit} exceeded`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when trying to delete a resource that has dependencies
 */
export class ResourceHasDependenciesException extends BusinessException {
  constructor(resourceType: string, dependencyType: string) {
    super(
      `Cannot delete ${resourceType} because it has associated ${dependencyType}`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception thrown when an operation is not allowed in the current state
 */
export class InvalidOperationException extends BusinessException {
  constructor(operation: string, reason?: string) {
    const message = reason 
      ? `Cannot perform '${operation}': ${reason}` 
      : `Operation '${operation}' is not allowed`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}