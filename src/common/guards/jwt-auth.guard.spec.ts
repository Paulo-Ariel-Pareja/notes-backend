import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [],
    publicLinks: [],
    isAdmin: () => false,
    isUser: () => true,
    getDisplayName: () => 'test@example.com',
    getPublicLinks: () => [],
    getActivePublicLinks: () => [],
    getPublicLinkCount: () => 0,
    hasPublicLinks: () => false,
  } as User;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (
    headers: any = {},
    isPublic: boolean = false,
  ): ExecutionContext => {
    mockReflector.getAllAndOverride.mockReturnValue(isPublic);

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          user: mockUser,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const context = createMockExecutionContext({}, true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', async () => {
      const context = createMockExecutionContext({}, false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const context = createMockExecutionContext();

      const result = guard.handleRequest(null, mockUser, null, context);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when no authorization header', () => {
      const context = createMockExecutionContext({});

      expect(() => {
        guard.handleRequest(new Error('No auth'), null, null, context);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid authorization header format', () => {
      const context = createMockExecutionContext({
        authorization: 'InvalidFormat token',
      });

      expect(() => {
        guard.handleRequest(new Error('Invalid format'), null, null, context);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid.jwt.token',
      });

      expect(() => {
        guard.handleRequest(null, null, { name: 'TokenExpiredError' }, context);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer invalid.jwt.token',
      });

      expect(() => {
        guard.handleRequest(null, null, { name: 'JsonWebTokenError' }, context);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for not active token', () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer notactive.jwt.token',
      });

      expect(() => {
        guard.handleRequest(null, null, { name: 'NotBeforeError' }, context);
      }).toThrow(UnauthorizedException);
    });

    it('should throw generic UnauthorizedException for other errors', () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer some.jwt.token',
      });

      expect(() => {
        guard.handleRequest(new Error('Generic error'), null, null, context);
      }).toThrow(UnauthorizedException);
    });
  });
});
