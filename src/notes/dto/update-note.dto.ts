import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class UpdateNoteDto {
  @ApiProperty({
    description: 'Note title',
    example: 'Updated Note Title',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'title must not exceed 255 characters' })
  title?: string;

  @ApiProperty({
    description: 'Note content/description',
    example: 'Updated note content...',
    maxLength: 10000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, {
    message: 'description must not exceed 10,000 characters',
  })
  description?: string;

  @ApiProperty({
    description: 'Note status',
    enum: NoteStatus,
    example: NoteStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(NoteStatus, { message: 'status must be either active or disabled' })
  status?: NoteStatus;
}
