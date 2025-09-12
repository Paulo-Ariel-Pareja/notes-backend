import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class UpdatePublicLinkDto {
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  expiresAt?: string;
}