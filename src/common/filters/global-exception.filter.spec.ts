import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ArgumentsHost,
} from '@nestjs/common';
import {
  GlobalExceptionFilter,
  ErrorResponse,
} from './global-exception.filter';
import { QueryFailedError } from 'typeorm';
import { Response, Request } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException correctly', () => {
      const exception = new BadRequestException('Validation failed');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          path: '/test',
          method: 'GET',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: ['field1 is required', 'field2 is invalid'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['field1 is required', 'field2 is invalid'],
          error: 'Bad Request',
          path: '/test',
          method: 'GET',
        }),
      );
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('User not found');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        }),
      );
    });

    it('should handle ForbiddenException', () => {
      const exception = new ForbiddenException('Access denied');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Access denied',
        }),
      );
    });

    it('should handle QueryFailedError with unique constraint', () => {
      const exception = new QueryFailedError(
        'INSERT INTO users',
        [],
        new Error('duplicate key value violates unique constraint'),
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'A record with this information already exists',
          error: 'Database Error',
        }),
      );
    });

    it('should handle QueryFailedError with foreign key constraint', () => {
      const exception = new QueryFailedError(
        'INSERT INTO notes',
        [],
        new Error('violates foreign key constraint'),
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Database Error',
        }),
      );
    });

    it('should handle QueryFailedError with not null constraint', () => {
      const exception = new QueryFailedError(
        'INSERT INTO users',
        [],
        new Error('null value in column "email" violates not-null constraint'),
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required field is missing',
          error: 'Database Error',
        }),
      );
    });

    it('should handle generic Error with "not found" message', () => {
      const exception = new Error('Resource not found');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Error',
        }),
      );
    });

    it('should handle generic Error with "unauthorized" message', () => {
      const exception = new Error('Unauthorized access');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Unauthorized access',
          error: 'Error',
        }),
      );
    });

    it('should handle generic Error with "validation" message', () => {
      const exception = new Error('Validation error occurred');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation error occurred',
          error: 'Error',
        }),
      );
    });

    it('should handle unknown exceptions', () => {
      const exception = 'Unknown error';

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/test',
          method: 'GET',
        }),
      );
    });

    it('should handle check constraint violations in QueryFailedError', () => {
      const exception = new QueryFailedError(
        'INSERT INTO users',
        [],
        new Error('check constraint violation'),
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data provided',
          error: 'Database Error',
        }),
      );
    });

    it('should handle generic database errors in QueryFailedError', () => {
      const exception = new QueryFailedError(
        'SELECT * FROM users',
        [],
        new Error('Some other database error'),
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Database operation failed',
          error: 'Database Error',
        }),
      );
    });

    it('should handle error with permission denied message', () => {
      const exception = new Error('Permission denied');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Permission denied',
          error: 'Error',
        }),
      );
    });

    it('should handle error with invalid data message', () => {
      const exception = new Error('Invalid data');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data',
          error: 'Error',
        }),
      );
    });

    it('should log other errors as info', () => {
      const logSpy = jest.spyOn(filter['logger'], 'log');
      const exception = new HttpException('Info message', HttpStatus.CONTINUE);

      filter.catch(exception, mockHost);

      expect(logSpy).toHaveBeenCalled();
      expect(logSpy.mock.calls[0][0]).toContain('Request Error');
      expect(logSpy.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          userId: 'Anonymous',
        }),
      );
    });

    it('should include user information in request context when available', () => {
      const mockRequestWithUser = {
        ...mockRequest,
        user: { id: 'user-123' },
      };

      const mockHostWithUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequestWithUser,
        }),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;

      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockHostWithUser);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
        }),
      );
    });

    it('should generate unique request IDs', () => {
      const exception1 = new BadRequestException('Error 1');
      const exception2 = new BadRequestException('Error 2');

      filter.catch(exception1, mockHost);
      const firstResponse = (mockResponse.json as jest.Mock).mock
        .calls[0][0] as ErrorResponse;

      jest.clearAllMocks();

      filter.catch(exception2, mockHost);
      const secondResponse = (mockResponse.json as jest.Mock).mock
        .calls[0][0] as ErrorResponse;

      expect(firstResponse.requestId).toBeDefined();
      expect(secondResponse.requestId).toBeDefined();
      expect(firstResponse.requestId).not.toBe(secondResponse.requestId);
    });

    it('should handle HttpException with empty response', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: expect.any(String),
        }),
      );
    });

    it('should log server errors correctly', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new Error('Server error');

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalled();
      expect(loggerSpy.mock.calls[0][0]).toContain('Server Error');
      expect(loggerSpy.mock.calls[0][2]).toEqual(
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          userId: 'Anonymous',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });

    it('should handle custom error objects', () => {
      const customError = {
        name: 'CustomError',
        message: 'Custom error message',
      };

      filter.catch(customError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    it('should include all required fields in error response', () => {
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: expect.any(Number),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          message: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should handle request with missing user-agent header', () => {
      const mockRequestWithoutUserAgent = {
        ...mockRequest,
        headers: {},
      };

      const mockHostWithoutUserAgent = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse as Response,
          getRequest: () => mockRequestWithoutUserAgent as Request,
        }),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as ArgumentsHost;

      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockHostWithoutUserAgent);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
