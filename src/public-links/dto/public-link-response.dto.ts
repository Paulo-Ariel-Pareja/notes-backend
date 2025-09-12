import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PublicLinkNoteDto {
  @ApiProperty({
    description: 'Note unique identifier',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Note title',
    example: 'My Shared Note',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Note status',
    example: 'active',
  })
  @Expose()
  status: string;
}

export class PublicLinkResponseDto {
  @ApiProperty({
    description: 'Public link unique identifier',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Public link identifier for sharing',
    example: 'abc123def456',
  })
  @Expose()
  publicId: string;

  @ApiProperty({
    description: 'Public link description',
    example: 'Sharing this note with the team',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Number of times the public link has been accessed',
    example: 42,
  })
  @Expose()
  viewCount: number;

  @ApiProperty({
    description: 'Public link creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last time the public link was accessed',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @Expose()
  lastAccessedAt?: Date;

  @ApiProperty({
    description: 'Public link expiration timestamp',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @Expose()
  expiresAt?: Date;

  @ApiProperty({
    description: 'Associated note information',
    type: PublicLinkNoteDto,
    required: false,
  })
  @Expose()
  @Type(() => PublicLinkNoteDto)
  note?: PublicLinkNoteDto;

  // Computed properties
  @ApiProperty({
    description: 'Whether the public link has expired',
    example: false,
  })
  @Expose()
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }

  @ApiProperty({
    description: 'Whether the public link is active (not expired)',
    example: true,
  })
  @Expose()
  get isActive(): boolean {
    return !this.isExpired;
  }

  @ApiProperty({
    description: 'Full public URL for accessing the note',
    example: '/public/notes/abc123def456',
  })
  @Expose()
  get publicUrl(): string {
    return `/public/notes/${this.publicId}`;
  }

  constructor(partial: Partial<PublicLinkResponseDto>) {
    Object.assign(this, partial);
  }
}