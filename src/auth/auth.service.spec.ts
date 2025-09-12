import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { PasswordService } from '../common/services/password.service';
import { JwtAuthService } from './jwt.service';
import { UserRole } from '../common/enums/user-role.enum';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let passwordService: PasswordService;
  let jwtAuthService: JwtAuthService;

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

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockPasswordService = {
    comparePasswords: jest.fn(),
  };

  const mockJwtAuthService = {
    generateToken: jest.fn(),
    getTokenExpirationTime: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const expectedToken = 'jwt.token.here';
      const expectedExpiresIn = 3600;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.comparePasswords.mockResolvedValue(true);
      mockJwtAuthService.generateToken.mockReturnValue(expectedToken);
      mockJwtAuthService.getTokenExpirationTime.mockReturnValue(
        expectedExpiresIn,
      );

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
      expect(passwordService.comparePasswords).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtAuthService.generateToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        accessToken: expectedToken,
        tokenType: 'Bearer',
        expiresIn: expectedExpiresIn,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(passwordService.comparePasswords).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should handle email case insensitivity', async () => {
      const loginDtoUpperCase: LoginDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.comparePasswords.mockResolvedValue(true);
      mockJwtAuthService.generateToken.mockReturnValue('token');
      mockJwtAuthService.getTokenExpirationTime.mockReturnValue(3600);

      await service.login(loginDtoUpperCase);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });
});
