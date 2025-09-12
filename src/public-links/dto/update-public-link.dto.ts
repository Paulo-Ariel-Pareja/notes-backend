import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePublicLinkDto {
  @ApiProperty({
    description: 'Updated description for the public link',
    example: 'Updated sharing description',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Updated expiration date for the public link (ISO date string)',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  expiresAt?: string;
}