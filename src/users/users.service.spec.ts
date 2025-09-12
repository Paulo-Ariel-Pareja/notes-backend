import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PasswordService } from '../common/services/password.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let passwordService: PasswordService;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [],
    publicLinks: [],
    isAdmin: jest.fn().mockReturnValue(false),
    isUser: jest.fn().mockReturnValue(true),
    getDisplayName: jest.fn().mockReturnValue('test'),
    getPublicLinks: jest.fn().mockReturnValue([]),
    getActivePublicLinks: jest.fn().mockReturnValue([]),
    getPublicLinkCount: jest.fn().mockReturnValue(0),
    hasPublicLinks: jest.fn().mockReturnValue(false),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockPasswordService = {
    validatePasswordStrength: jest.fn(),
    hashPassword: jest.fn(),
    comparePasswords: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'ValidPass123';

    it('should create a user successfully', async () => {
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('hashedPassword');
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(validEmail, validPassword);

      expect(passwordService.hashPassword).toHaveBeenCalledWith(validPassword);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: validEmail.toLowerCase(),
        password: 'hashedPassword',
        role: UserRole.USER,
      });
      expect(result).toBe(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser); // Existing user

      await expect(service.create(validEmail, validPassword)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create admin user when role is specified', async () => {
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('hashedPassword');
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.create(validEmail, validPassword, UserRole.ADMIN);

      expect(userRepository.create).toHaveBeenCalledWith({
        email: validEmail.toLowerCase(),
        password: 'hashedPassword',
        role: UserRole.ADMIN,
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-id');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        relations: ['notes'],
      });
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null for empty id', async () => {
      const result = await service.findById('');

      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      const total = 1;
      mockUserRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll();

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['notes'],
      });
      expect(result).toEqual({
        users,
        total,
        page: 1,
        totalPages: 1,
      });
    });

    it('should calculate pagination correctly', async () => {
      const users = [mockUser];
      const total = 45;
      mockUserRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll(2, 20);

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        order: { createdAt: 'DESC' },
        relations: ['notes'],
      });
      expect(result.totalPages).toBe(3);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete('user-id');

      expect(userRepository.delete).toHaveBeenCalledWith('user-id');
      expect(result).toBe(undefined);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const newPassword = 'NewPass123';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.comparePasswords.mockResolvedValue(true);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('newHashedPassword');
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.changePassword('user-id', newPassword);

      expect(passwordService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if user already exists', async () => {
      const newPassword = 'NewPass123';

      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.changePassword('user-id', newPassword),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
