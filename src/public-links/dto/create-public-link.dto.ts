import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class CreatePublicLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'expiration date must be a valid ISO date string' })
  expiresAt?: string;
}