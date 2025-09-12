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

  /**
   * Create a new user (Admin only)
   * @param createUserDto - User creation data
   * @returns Created user
   */
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

  /**
   * Get all users with pagination (Admin only)
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated users
   */
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

  /**
   * Get user by ID (Admin only)
   * @param id - User ID
   * @returns User data
   */
  @Get(':id')
  @RequireAdminRole()
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return plainToInstance(UserResponseDto, user);
  }

  /**
   * Change user password
   * @param id - User ID
   * @param changePasswordDto - Password change data
   * @param currentUser - Current authenticated user
   * @returns Success message
   */
  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id) {
      throw new Error('You can only change your own password');
    }

    await this.usersService.changePassword(id, changePasswordDto.password);

    return { message: 'Password changed successfully' };
  }

  /**
   * Delete user (Admin only)
   * @param id - User ID
   * @returns Success message
   */
  @Delete(':id')
  @RequireAdminRole()
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
