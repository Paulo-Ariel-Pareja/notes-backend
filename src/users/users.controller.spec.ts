import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, ChangePasswordDto } from './dto';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PolicyEngineService } from '../abac/policy-engine.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

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

  const mockAdminUser: User = {
    ...mockUser,
    id: 'admin-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    publicLinks: [],
    isAdmin: jest.fn().mockReturnValue(true),
    isUser: jest.fn().mockReturnValue(false),
    getDisplayName: jest.fn().mockReturnValue('admin'),
    getPublicLinks: jest.fn().mockReturnValue([]),
    getActivePublicLinks: jest.fn().mockReturnValue([]),
    getPublicLinkCount: jest.fn().mockReturnValue(0),
    hasPublicLinks: jest.fn().mockReturnValue(false),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    changePassword: jest.fn(),
    findByRole: jest.fn(),
    getTotalCount: jest.fn(),
    getAdmins: jest.fn(),
    getRegularUsers: jest.fn(),
    getUserStats: jest.fn(),
  };

  const mockPolicyEngineService = {
    evaluate: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PolicyEngineService,
          useValue: mockPolicyEngineService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123',
        role: UserRole.USER,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
        createUserDto.role,
      );
      expect(result.email).toBe(mockUser.email);
      expect(result.password).toBeUndefined(); // Should be excluded
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = {
        users: [mockUser],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);

      expect(usersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.users).toHaveLength(1);
      expect(result.users[0].password).toBeUndefined(); // Should be excluded
    });
  });

  describe('findOne', () => {
    it('should return user by ID', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-id');

      expect(usersService.findById).toHaveBeenCalledWith('user-id');
      expect(result.email).toBe(mockUser.email);
      expect(result.password).toBeUndefined(); // Should be excluded
    });

    it('should throw error when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('changePassword', () => {
    it('should allow user to change their own password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        password: 'NewPass123',
      };

      mockUsersService.changePassword.mockResolvedValue(mockUser);

      const result = await controller.changePassword(
        'user-id',
        changePasswordDto,
        mockUser,
      );

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'user-id',
        changePasswordDto.password,
      );
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw error when user tries to change another user password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        password: 'NewPass123',
      };

      await expect(
        controller.changePassword('other-user-id', changePasswordDto, mockUser),
      ).rejects.toThrow('You can only change your own password');
    });

    it('should allow admin to change any user password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        password: 'NewPass123',
      };

      mockUsersService.changePassword.mockResolvedValue(mockUser);

      const result = await controller.changePassword(
        'user-id',
        changePasswordDto,
        mockUser,
      );

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'user-id',
        changePasswordDto.password,
      );
      expect(result.message).toBe('Password changed successfully');
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockUsersService.delete.mockResolvedValue(true);

      const result = await controller.remove('user-id');

      expect(usersService.delete).toHaveBeenCalledWith('user-id');
      expect(result.message).toBe('User deleted successfully');
    });

    it('should NOT throw error when user not found', async () => {
      mockUsersService.delete.mockResolvedValue(true);

      const result = await controller.remove('non-existent-id');

      expect(usersService.delete).toHaveBeenCalledWith('non-existent-id');
      expect(result.message).toBe('User deleted successfully');
    });
  });
});
