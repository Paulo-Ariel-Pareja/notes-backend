import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class NoteSearchDto {
  @IsOptional()
  @IsString({ message: 'search term must be a string' })
  search?: string;

  @IsOptional()
  @IsEnum(NoteStatus, { message: 'status must be either active or disabled' })
  status?: NoteStatus = NoteStatus.ACTIVE;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 10;
}
