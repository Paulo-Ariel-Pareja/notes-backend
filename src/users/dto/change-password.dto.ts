import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'newpassword123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8)
  password: string;
}
