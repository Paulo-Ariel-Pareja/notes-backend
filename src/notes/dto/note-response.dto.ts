import { Expose, Type } from 'class-transformer';
import { NoteStatus } from '../../common/enums/note-status.enum';

export class NoteOwnerDto {
  @Expose()
  id: string;

  @Expose()
  email: string;
}

export class PublicLinkSummaryDto {
  @Expose()
  id: string;

  @Expose()
  publicId: string;

  @Expose()
  viewCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  lastAccessedAt?: Date;

  @Expose()
  expiresAt?: Date;
}

export class NoteResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: NoteStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => NoteOwnerDto)
  owner?: NoteOwnerDto;

  @Expose()
  @Type(() => PublicLinkSummaryDto)
  publicLinks?: PublicLinkSummaryDto[];

  // Computed properties
  @Expose()
  get wordCount(): number {
    return this.description?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
  }

  @Expose()
  get characterCount(): number {
    return this.description?.length || 0;
  }

  @Expose()
  get summary(): string {
    if (!this.description) return '';
    return this.description.length <= 100 
      ? this.description 
      : this.description.substring(0, 100) + '...';
  }

  @Expose()
  get isPubliclyShared(): boolean {
    return !!(this.publicLinks && this.publicLinks.length > 0);
  }

  @Expose()
  get totalViews(): number {
    return this.publicLinks?.reduce((sum, link) => sum + link.viewCount, 0) || 0;
  }

  constructor(partial: Partial<NoteResponseDto>) {
    Object.assign(this, partial);
  }
}