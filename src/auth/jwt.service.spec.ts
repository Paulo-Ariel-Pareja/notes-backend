import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthService } from './jwt.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { time } from 'console';

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

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

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a JWT token for a user', () => {
      const expectedToken = 'jwt.token.here';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.generateToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a JWT token', () => {
      const token = 'jwt.token.here';
      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = service.verifyToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedPayload);
    });
  });

  describe('decodeToken', () => {
    it('should decode a JWT token without verification', () => {
      const token = 'jwt.token.here';
      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      mockJwtService.decode.mockReturnValue(expectedPayload);

      const result = service.decodeToken(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedPayload);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return expiration time in seconds for seconds', () => {
      mockConfigService.getOrThrow.mockReturnValue('10s');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(10);
    });

    it('should return expiration time in seconds for hours', () => {
      mockConfigService.getOrThrow.mockReturnValue('2h');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(7200);
    });

    it('should return expiration time in seconds for minutes', () => {
      mockConfigService.getOrThrow.mockReturnValue('30m');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(1800);
    });

    it('should return expiration time in seconds for days', () => {
      mockConfigService.getOrThrow.mockReturnValue('1d');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(86400);
    });

    it('should return default expiration time for invalid format', () => {
      mockConfigService.getOrThrow.mockReturnValue('120x');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(3600);
    });

    it('should return default expiration time for invalid format', () => {
      mockConfigService.getOrThrow.mockReturnValue('invalid');

      const result = service.getTokenExpirationTime();

      expect(result).toBe(3600);
    });
  });
});
