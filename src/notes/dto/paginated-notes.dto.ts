import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NoteResponseDto } from './note-response.dto';

export class PaginatedNotesDto {
  @ApiProperty({
    description: 'Array of notes',
    type: [NoteResponseDto],
  })
  @Expose()
  @Type(() => NoteResponseDto)
  notes: NoteResponseDto[];

  @ApiProperty({
    description: 'Total number of notes',
    example: 25,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  @Expose()
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  @Expose()
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  @Expose()
  hasPreviousPage: boolean;

  constructor(partial: Partial<PaginatedNotesDto>) {
    Object.assign(this, partial);
    this.hasNextPage = this.page < this.totalPages;
    this.hasPreviousPage = this.page > 1;
  }
}
