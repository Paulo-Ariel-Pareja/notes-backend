import { Expose, Type } from 'class-transformer';
import { NoteResponseDto } from './note-response.dto';

export class PaginatedNotesDto {
  @Expose()
  @Type(() => NoteResponseDto)
  notes: NoteResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;

  constructor(partial: Partial<PaginatedNotesDto>) {
    Object.assign(this, partial);
    this.hasNextPage = this.page < this.totalPages;
    this.hasPreviousPage = this.page > 1;
  }
}
