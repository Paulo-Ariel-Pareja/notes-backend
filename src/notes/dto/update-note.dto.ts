import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'title must not exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, {
    message: 'description must not exceed 10,000 characters',
  })
  description?: string;

  @IsOptional()
  @IsEnum(NoteStatus, { message: 'status must be either active or disabled' })
  status?: NoteStatus;
}
