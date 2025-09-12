import { Expose, Type } from 'class-transformer';

export class PublicLinkNoteDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  status: string;
}

export class PublicLinkResponseDto {
  @Expose()
  id: string;

  @Expose()
  publicId: string;

  @Expose()
  description?: string;

  @Expose()
  viewCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  lastAccessedAt?: Date;

  @Expose()
  expiresAt?: Date;

  @Expose()
  @Type(() => PublicLinkNoteDto)
  note?: PublicLinkNoteDto;

  // Computed properties
  @Expose()
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }

  @Expose()
  get isActive(): boolean {
    return !this.isExpired;
  }

  @Expose()
  get publicUrl(): string {
    return `/public/notes/${this.publicId}`;
  }

  constructor(partial: Partial<PublicLinkResponseDto>) {
    Object.assign(this, partial);
  }
}