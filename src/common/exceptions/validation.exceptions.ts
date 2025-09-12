import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for validation exceptions
 */
export abstract class ValidationException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * Exception thrown when required fields are missing
 */
export class MissingRequiredFieldException extends ValidationException {
  constructor(fieldName: string) {
    super(`Required field '${fieldName}' is missing`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when field format is invalid
 */
export class InvalidFieldFormatException extends ValidationException {
  constructor(fieldName: string, expectedFormat?: string) {
    const message = expectedFormat 
      ? `Invalid format for field '${fieldName}'. Expected: ${expectedFormat}` 
      : `Invalid format for field '${fieldName}'`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when field value is out of allowed range
 */
export class FieldOutOfRangeException extends ValidationException {
  constructor(fieldName: string, min?: number, max?: number) {
    let message = `Field '${fieldName}' is out of range`;
    
    if (min !== undefined && max !== undefined) {
      message += `. Must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      message += `. Must be at least ${min}`;
    } else if (max !== undefined) {
      message += `. Must be at most ${max}`;
    }
    
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when field value exceeds maximum length
 */
export class FieldTooLongException extends ValidationException {
  constructor(fieldName: string, maxLength: number, actualLength?: number) {
    const lengthInfo = actualLength 
      ? ` (${actualLength} characters provided)` 
      : '';
    super(
      `Field '${fieldName}' exceeds maximum length of ${maxLength} characters${lengthInfo}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when field value is below minimum length
 */
export class FieldTooShortException extends ValidationException {
  constructor(fieldName: string, minLength: number, actualLength?: number) {
    const lengthInfo = actualLength 
      ? ` (${actualLength} characters provided)` 
      : '';
    super(
      `Field '${fieldName}' must be at least ${minLength} characters${lengthInfo}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when email format is invalid
 */
export class InvalidEmailFormatException extends ValidationException {
  constructor(email?: string) {
    const message = email 
      ? `Invalid email format: '${email}'` 
      : 'Invalid email format';
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when password doesn't meet requirements
 */
export class WeakPasswordException extends ValidationException {
  constructor(requirements?: string[]) {
    let message = 'Password does not meet security requirements';
    
    if (requirements && requirements.length > 0) {
      message += ': ' + requirements.join(', ');
    }
    
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when enum value is invalid
 */
export class InvalidEnumValueException extends ValidationException {
  constructor(fieldName: string, value: string, allowedValues: string[]) {
    super(
      `Invalid value '${value}' for field '${fieldName}'. Allowed values: ${allowedValues.join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when UUID format is invalid
 */
export class InvalidUuidFormatException extends ValidationException {
  constructor(fieldName: string, value?: string) {
    const valueInfo = value ? ` '${value}'` : '';
    super(
      `Invalid UUID format for field '${fieldName}'${valueInfo}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when date format is invalid
 */
export class InvalidDateFormatException extends ValidationException {
  constructor(fieldName: string, value?: string, expectedFormat?: string) {
    let message = `Invalid date format for field '${fieldName}'`;
    
    if (value) {
      message += ` '${value}'`;
    }
    
    if (expectedFormat) {
      message += `. Expected format: ${expectedFormat}`;
    }
    
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when multiple validation errors occur
 */
export class MultipleValidationException extends ValidationException {
  constructor(errors: string[]) {
    const message = `Validation failed: ${errors.join('; ')}`;
    super(message, HttpStatus.BAD_REQUEST);
  }
}