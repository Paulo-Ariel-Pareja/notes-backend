import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NoteStatsDto {
  @ApiProperty({
    description: 'Total number of notes',
    example: 25,
  })
  @Expose()
  totalNotes: number;

  @ApiProperty({
    description: 'Number of active notes',
    example: 20,
  })
  @Expose()
  activeNotes: number;

  @ApiProperty({
    description: 'Number of disabled notes',
    example: 5,
  })
  @Expose()
  disabledNotes: number;

  @ApiProperty({
    description: 'Number of shared notes',
    example: 8,
  })
  @Expose()
  sharedNotes: number;

  @ApiProperty({
    description: 'Total views across all shared notes',
    example: 150,
  })
  @Expose()
  totalViews: number;

  constructor(partial: Partial<NoteStatsDto>) {
    Object.assign(this, partial);
  }
}

export class SystemNoteStatsDto extends NoteStatsDto {
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 100,
    required: false,
  })
  @Expose()
  totalUsers?: number;

  @ApiProperty({
    description: 'Average number of notes per user',
    example: 2.5,
    required: false,
  })
  @Expose()
  averageNotesPerUser?: number;

  constructor(partial: Partial<SystemNoteStatsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}