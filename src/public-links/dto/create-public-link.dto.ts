import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePublicLinkDto {
  @ApiProperty({
    description: 'Optional description for the public link',
    example: 'Sharing this note with the team',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Optional expiration date for the public link (ISO date string)',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'expiration date must be a valid ISO date string' })
  expiresAt?: string;
}