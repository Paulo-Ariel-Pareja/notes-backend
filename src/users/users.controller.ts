import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto, ChangePasswordDto, UserResponseDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { RequireAdminRole } from '../abac/decorators/abac.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AbacGuard } from '../abac/guards/abac.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, AbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account (admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin role required',
  })
  @Post()
  @RequireAdminRole()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.role,
    );

    return plainToInstance(UserResponseDto, user);
  }

  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve all users with pagination (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    example: {
      users: [
        {
          id: 'uuid-string',
          email: 'user@example.com',
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin role required',
  })
  @Get()
  @RequireAdminRole()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.usersService.findAll(page, limit);

    return {
      ...result,
      users: result.users.map((user) => plainToInstance(UserResponseDto, user)),
    };
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin role required',
  })
  @Get(':id')
  @RequireAdminRole()
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserResponseDto, user);
  }

  @ApiOperation({
    summary: 'Change user password',
    description: 'Change password for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    example: {
      message: 'Password changed successfully',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or user mismatch',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    await this.usersService.changePassword(id, changePasswordDto.password);

    return { message: 'Password changed successfully' };
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user account (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    example: {
      message: 'User deleted successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin role required',
  })
  @Delete(':id')
  @RequireAdminRole()
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
