import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8)
  password: string;
}
