import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class NoteSearchDto {
  @ApiProperty({
    description: 'Search term to filter notes by title or description',
    example: 'important',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'search term must be a string' })
  search?: string;

  @ApiProperty({
    description: 'Filter notes by status',
    enum: NoteStatus,
    example: NoteStatus.ACTIVE,
    default: NoteStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(NoteStatus, { message: 'status must be either active or disabled' })
  status?: NoteStatus = NoteStatus.ACTIVE;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 10;
}
