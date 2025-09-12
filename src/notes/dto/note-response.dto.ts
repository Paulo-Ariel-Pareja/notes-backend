import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class NoteOwnerDto {
  @Exclude()
  id: string;

  @ApiProperty({
    description: 'Owner email address',
    example: 'owner@example.com',
  })
  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  role: string;

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}

export class PublicLinkSummaryDto {
  @Exclude()
  id: string;

  @ApiProperty({
    description: 'Public link identifier',
    example: 'abc123def456',
  })
  @Expose()
  publicId: string;

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

  @Exclude()
  noteId: string;

  @Exclude()
  createdById: string;

  @Exclude()
  description: string;

  @Exclude()
  updatedAt: string;
}

export class NoteResponseDto {
  @ApiProperty({
    description: 'Note unique identifier',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Note title',
    example: 'My Important Note',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Note content/description',
    example: 'This is the detailed content of my note...',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Note status',
    enum: NoteStatus,
    example: NoteStatus.ACTIVE,
  })
  @Expose()
  status: NoteStatus;

  @ApiProperty({
    description: 'Note creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Note last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Note owner information',
    type: NoteOwnerDto,
    required: false,
  })
  @Expose()
  @Type(() => NoteOwnerDto)
  owner?: NoteOwnerDto;

  @ApiProperty({
    description: 'Public links associated with this note',
    type: [PublicLinkSummaryDto],
    required: false,
  })
  @Expose()
  @Type(() => PublicLinkSummaryDto)
  publicLinks?: PublicLinkSummaryDto[];

  // Computed properties
  @ApiProperty({
    description: 'Number of words in the note description',
    example: 150,
  })
  @Expose()
  get wordCount(): number {
    return (
      this.description
        ?.trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length || 0
    );
  }

  @ApiProperty({
    description: 'Number of characters in the note description',
    example: 1024,
  })
  @Expose()
  get characterCount(): number {
    return this.description?.length || 0;
  }

  @ApiProperty({
    description: 'Short summary of the note (first 100 characters)',
    example: 'This is the detailed content of my note...',
  })
  @Expose()
  get summary(): string {
    if (!this.description) return '';
    return this.description.length <= 100
      ? this.description
      : this.description.substring(0, 100) + '...';
  }

  @ApiProperty({
    description: 'Whether the note is publicly shared',
    example: true,
  })
  @Expose()
  get isPubliclyShared(): boolean {
    return !!(this.publicLinks && this.publicLinks.length > 0);
  }

  @ApiProperty({
    description: 'Total views across all public links',
    example: 42,
  })
  @Expose()
  get totalViews(): number {
    return (
      this.publicLinks?.reduce((sum, link) => sum + link.viewCount, 0) || 0
    );
  }

  constructor(partial: Partial<NoteResponseDto>) {
    Object.assign(this, partial);
  }
}
