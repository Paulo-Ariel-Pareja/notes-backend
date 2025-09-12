import { Expose } from 'class-transformer';

export class NoteStatsDto {
  @Expose()
  totalNotes: number;

  @Expose()
  activeNotes: number;

  @Expose()
  disabledNotes: number;

  @Expose()
  sharedNotes: number;

  @Expose()
  totalViews: number;

  constructor(partial: Partial<NoteStatsDto>) {
    Object.assign(this, partial);
  }
}

export class SystemNoteStatsDto extends NoteStatsDto {
  @Expose()
  totalUsers?: number;

  @Expose()
  averageNotesPerUser?: number;

  constructor(partial: Partial<SystemNoteStatsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}