import { HttpStatus } from '@nestjs/common';
import {
  // Business exceptions
  BusinessException,
  ResourceOwnershipException,
  NoteNotFoundException,
  UserNotFoundException,
  PublicLinkNotFoundException,
  NoteInactiveException,
  PublicLinkExpiredException,
  CannotShareInactiveNoteException,
  InvalidPasswordException,
  IncorrectCurrentPasswordException,
  EmailAlreadyExistsException,
  InsufficientPermissionsException,
  BusinessValidationException,
  ResourceLimitExceededException,
  ResourceHasDependenciesException,
  InvalidOperationException,

  // Auth exceptions
  AuthException,
  InvalidCredentialsException,
  InvalidTokenException,
  MissingTokenException,
  AccountDisabledException,
  UnauthorizedAccessException,
  PolicyViolationException,
  InsufficientRoleException,
  SessionExpiredException,
  TooManyAttemptsException,

  // Validation exceptions
  ValidationException,
  MissingRequiredFieldException,
  InvalidFieldFormatException,
  FieldOutOfRangeException,
  FieldTooLongException,
  FieldTooShortException,
  InvalidEmailFormatException,
  WeakPasswordException,
  InvalidEnumValueException,
  InvalidUuidFormatException,
  InvalidDateFormatException,
  MultipleValidationException,
} from './index';

describe('Custom Exceptions', () => {
  describe('Business Exceptions', () => {
    it('should create ResourceOwnershipException with correct message and status', () => {
      const exception = new ResourceOwnershipException('note');
      expect(exception.message).toBe(
        'You do not have permission to access this note',
      );
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create ResourceOwnershipException with default resource type', () => {
      const exception = new ResourceOwnershipException();
      expect(exception.message).toBe(
        'You do not have permission to access this resource',
      );
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create NoteNotFoundException with note ID', () => {
      const exception = new NoteNotFoundException('note-123');
      expect(exception.message).toBe("Note with ID 'note-123' not found");
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create NoteNotFoundException without note ID', () => {
      const exception = new NoteNotFoundException();
      expect(exception.message).toBe('Note not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create UserNotFoundException with identifier', () => {
      const exception = new UserNotFoundException('user@example.com');
      expect(exception.message).toBe(
        "User with identifier 'user@example.com' not found",
      );
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create UserNotFoundException without identifier', () => {
      const exception = new UserNotFoundException();
      expect(exception.message).toBe('User not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create PublicLinkNotFoundException with public ID', () => {
      const exception = new PublicLinkNotFoundException('public-123');
      expect(exception.message).toBe(
        "Public link with ID 'public-123' not found",
      );
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create PublicLinkNotFoundException without public ID', () => {
      const exception = new PublicLinkNotFoundException();
      expect(exception.message).toBe('Public link not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create NoteInactiveException', () => {
      const exception = new NoteInactiveException();
      expect(exception.message).toBe('This note is no longer available');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create PublicLinkExpiredException', () => {
      const exception = new PublicLinkExpiredException();
      expect(exception.message).toBe('This shared link has expired');
      expect(exception.getStatus()).toBe(HttpStatus.GONE);
    });

    it('should create CannotShareInactiveNoteException', () => {
      const exception = new CannotShareInactiveNoteException();
      expect(exception.message).toBe('Cannot share a disabled note');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidPasswordException with custom message', () => {
      const message = 'Password must contain at least one number';
      const exception = new InvalidPasswordException(message);
      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidPasswordException with default message', () => {
      const exception = new InvalidPasswordException();
      expect(exception.message).toBe('Invalid password');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create IncorrectCurrentPasswordException', () => {
      const exception = new IncorrectCurrentPasswordException();
      expect(exception.message).toBe('Current password is incorrect');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create EmailAlreadyExistsException with email', () => {
      const exception = new EmailAlreadyExistsException('test@example.com');
      expect(exception.message).toBe(
        "Email 'test@example.com' is already registered",
      );
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should create EmailAlreadyExistsException without email', () => {
      const exception = new EmailAlreadyExistsException();
      expect(exception.message).toBe('Email is already registered');
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should create InsufficientPermissionsException with operation', () => {
      const exception = new InsufficientPermissionsException('delete user');
      expect(exception.message).toBe(
        "Insufficient permissions to perform 'delete user'",
      );
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create InsufficientPermissionsException without operation', () => {
      const exception = new InsufficientPermissionsException();
      expect(exception.message).toBe('Insufficient permissions');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create BusinessValidationException', () => {
      const exception = new BusinessValidationException(
        'Invalid business operation',
      );
      expect(exception.message).toBe('Invalid business operation');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create ResourceLimitExceededException', () => {
      const exception = new ResourceLimitExceededException('Notes', 100);
      expect(exception.message).toBe('Notes limit of 100 exceeded');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create ResourceHasDependenciesException', () => {
      const exception = new ResourceHasDependenciesException('User', 'notes');
      expect(exception.message).toBe(
        'Cannot delete User because it has associated notes',
      );
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should create InvalidOperationException with reason', () => {
      const exception = new InvalidOperationException(
        'delete',
        'resource is in use',
      );
      expect(exception.message).toBe(
        "Cannot perform 'delete': resource is in use",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidOperationException without reason', () => {
      const exception = new InvalidOperationException('delete');
      expect(exception.message).toBe("Operation 'delete' is not allowed");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Auth Exceptions', () => {
    it('should create InvalidCredentialsException', () => {
      const exception = new InvalidCredentialsException();
      expect(exception.message).toBe('Invalid email or password');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create InvalidTokenException with custom message', () => {
      const exception = new InvalidTokenException('Token has expired');
      expect(exception.message).toBe('Token has expired');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create InvalidTokenException with default message', () => {
      const exception = new InvalidTokenException();
      expect(exception.message).toBe('Invalid or expired token');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create MissingTokenException', () => {
      const exception = new MissingTokenException();
      expect(exception.message).toBe('Authentication token is required');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create AccountDisabledException', () => {
      const exception = new AccountDisabledException();
      expect(exception.message).toBe('Account is disabled');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create UnauthorizedAccessException with resource', () => {
      const exception = new UnauthorizedAccessException('admin panel');
      expect(exception.message).toBe('Unauthorized access to admin panel');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create UnauthorizedAccessException without resource', () => {
      const exception = new UnauthorizedAccessException();
      expect(exception.message).toBe('Unauthorized access');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create PolicyViolationException', () => {
      const exception = new PolicyViolationException('delete', 'note');
      expect(exception.message).toBe(
        "Access denied: Cannot perform 'delete' on 'note'",
      );
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create InsufficientRoleException', () => {
      const exception = new InsufficientRoleException('admin');
      expect(exception.message).toBe("Access denied: 'admin' role required");
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create SessionExpiredException', () => {
      const exception = new SessionExpiredException();
      expect(exception.message).toBe('Session has expired, please login again');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should create TooManyAttemptsException with retry time', () => {
      const exception = new TooManyAttemptsException(300);
      expect(exception.message).toBe(
        'Too many attempts. Please try again in 300 seconds',
      );
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should create TooManyAttemptsException without retry time', () => {
      const exception = new TooManyAttemptsException();
      expect(exception.message).toBe(
        'Too many attempts. Please try again later',
      );
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('Validation Exceptions', () => {
    it('should create MissingRequiredFieldException', () => {
      const exception = new MissingRequiredFieldException('email');
      expect(exception.message).toBe("Required field 'email' is missing");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidFieldFormatException with expected format', () => {
      const exception = new InvalidFieldFormatException('date', 'YYYY-MM-DD');
      expect(exception.message).toBe(
        "Invalid format for field 'date'. Expected: YYYY-MM-DD",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidFieldFormatException without expected format', () => {
      const exception = new InvalidFieldFormatException('phone');
      expect(exception.message).toBe("Invalid format for field 'phone'");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldOutOfRangeException with min and max', () => {
      const exception = new FieldOutOfRangeException('age', 18, 99);
      expect(exception.message).toBe(
        "Field 'age' is out of range. Must be between 18 and 99",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldOutOfRangeException with only min', () => {
      const exception = new FieldOutOfRangeException('age', 18);
      expect(exception.message).toBe(
        "Field 'age' is out of range. Must be at least 18",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldOutOfRangeException with only max', () => {
      const exception = new FieldOutOfRangeException('age', undefined, 99);
      expect(exception.message).toBe(
        "Field 'age' is out of range. Must be at most 99",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldOutOfRangeException without min or max', () => {
      const exception = new FieldOutOfRangeException('age');
      expect(exception.message).toBe("Field 'age' is out of range");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldTooLongException with actual length', () => {
      const exception = new FieldTooLongException('title', 50, 55);
      expect(exception.message).toBe(
        "Field 'title' exceeds maximum length of 50 characters (55 characters provided)",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldTooLongException without actual length', () => {
      const exception = new FieldTooLongException('title', 50);
      expect(exception.message).toBe(
        "Field 'title' exceeds maximum length of 50 characters",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldTooShortException with actual length', () => {
      const exception = new FieldTooShortException('password', 8, 6);
      expect(exception.message).toBe(
        "Field 'password' must be at least 8 characters (6 characters provided)",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create FieldTooShortException without actual length', () => {
      const exception = new FieldTooShortException('password', 8);
      expect(exception.message).toBe(
        "Field 'password' must be at least 8 characters",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidEmailFormatException with email', () => {
      const exception = new InvalidEmailFormatException('invalid@email');
      expect(exception.message).toBe("Invalid email format: 'invalid@email'");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidEmailFormatException without email', () => {
      const exception = new InvalidEmailFormatException();
      expect(exception.message).toBe('Invalid email format');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create WeakPasswordException with requirements', () => {
      const requirements = [
        'at least 8 characters',
        'one uppercase letter',
        'one number',
      ];
      const exception = new WeakPasswordException(requirements);
      expect(exception.message).toBe(
        'Password does not meet security requirements: at least 8 characters, one uppercase letter, one number',
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create WeakPasswordException without requirements', () => {
      const exception = new WeakPasswordException();
      expect(exception.message).toBe(
        'Password does not meet security requirements',
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidEnumValueException', () => {
      const allowedValues = ['ACTIVE', 'INACTIVE', 'PENDING'];
      const exception = new InvalidEnumValueException(
        'status',
        'INVALID',
        allowedValues,
      );
      expect(exception.message).toBe(
        "Invalid value 'INVALID' for field 'status'. Allowed values: ACTIVE, INACTIVE, PENDING",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidUuidFormatException with value', () => {
      const exception = new InvalidUuidFormatException(
        'userId',
        'invalid-uuid',
      );
      expect(exception.message).toBe(
        "Invalid UUID format for field 'userId' 'invalid-uuid'",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidUuidFormatException without value', () => {
      const exception = new InvalidUuidFormatException('userId');
      expect(exception.message).toBe("Invalid UUID format for field 'userId'");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidDateFormatException with value and format', () => {
      const exception = new InvalidDateFormatException(
        'birthDate',
        '2023/12/31',
        'YYYY-MM-DD',
      );
      expect(exception.message).toBe(
        "Invalid date format for field 'birthDate' '2023/12/31'. Expected format: YYYY-MM-DD",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidDateFormatException with value only', () => {
      const exception = new InvalidDateFormatException(
        'birthDate',
        '2023/12/31',
      );
      expect(exception.message).toBe(
        "Invalid date format for field 'birthDate' '2023/12/31'",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidDateFormatException without value or format', () => {
      const exception = new InvalidDateFormatException('birthDate');
      expect(exception.message).toBe(
        "Invalid date format for field 'birthDate'",
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create MultipleValidationException', () => {
      const errors = [
        'Email is required',
        'Password is too short',
        'Invalid role',
      ];
      const exception = new MultipleValidationException(errors);
      expect(exception.message).toBe(
        'Validation failed: Email is required; Password is too short; Invalid role',
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
