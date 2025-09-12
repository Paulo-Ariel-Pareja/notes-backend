import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { QueryFailedError } from 'typeorm';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

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
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;
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

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/test',
          method: 'GET',
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
      const firstCall = mockResponse.json.mock.calls[0][0];

      jest.clearAllMocks();

      filter.catch(exception2, mockHost);
      const secondCall = mockResponse.json.mock.calls[0][0];

      expect(firstCall.requestId).toBeDefined();
      expect(secondCall.requestId).toBeDefined();
      expect(firstCall.requestId).not.toBe(secondCall.requestId);
    });
  });
});