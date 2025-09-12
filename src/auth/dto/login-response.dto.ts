import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  @Expose()
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  @Expose()
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid-string',
      email: 'user@example.com',
      role: 'user',
    },
  })
  @Expose()
  user: {
    id: string;
    email: string;
    role: UserRole;
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
