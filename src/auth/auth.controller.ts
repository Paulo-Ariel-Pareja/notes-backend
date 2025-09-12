import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password to receive JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    example: {
      statusCode: 400,
      message: ['email must be an email', 'password should not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    example: {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    },
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
