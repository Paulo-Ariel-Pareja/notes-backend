import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoteStatus } from '../../common/enums/note-status.enum';
import { User } from '../../users/entities/user.entity';
import { PublicLink } from '../../public-links/entities/public-link.entity';

@Entity('notes')
@Index(['ownerId', 'status']) // Composite index for efficient queries
@Index(['status']) // Index for status-based queries
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: NoteStatus,
    default: NoteStatus.ACTIVE,
  })
  status: NoteStatus;

  @ManyToOne(() => User, (user) => user.notes, {
    onDelete: 'CASCADE', // Delete notes when user is deleted
    nullable: false,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => PublicLink, (publicLink) => publicLink.note, {
    cascade: true, // Cascade operations to public links
  })
  publicLinks: PublicLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if the note is active
   */
  isActive(): boolean {
    return this.status === NoteStatus.ACTIVE;
  }

  /**
   * Check if the note is disabled
   */
  isDisabled(): boolean {
    return this.status === NoteStatus.DISABLED;
  }

  /**
   * Enable the note
   */
  enable(): void {
    this.status = NoteStatus.ACTIVE;
  }

  /**
   * Disable the note
   */
  disable(): void {
    this.status = NoteStatus.DISABLED;
  }

  /**
   * Check if a user owns this note
   */
  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  /**
   * Get a summary of the note (first 100 characters of description)
   */
  getSummary(maxLength: number = 100): string {
    if (this.description.length <= maxLength) {
      return this.description;
    }
    return this.description.substring(0, maxLength) + '...';
  }

  /**
   * Get word count of the description
   */
  getWordCount(): number {
    return this.description
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Get character count of the description
   */
  getCharacterCount(): number {
    return this.description.length;
  }

  /**
   * Check if the note has any public links
   */
  hasPublicLinks(): boolean {
    return this.publicLinks && this.publicLinks.length > 0;
  }

  /**
   * Get active public links (non-expired)
   */
  getActivePublicLinks(): PublicLink[] {
    if (!this.publicLinks) return [];
    return this.publicLinks.filter((link) => link.isActive());
  }

  /**
   * Get total view count from all public links
   */
  getTotalViews(): number {
    if (!this.publicLinks) return 0;
    return this.publicLinks.reduce((total, link) => total + link.viewCount, 0);
  }

  /**
   * Check if the note is publicly accessible
   */
  isPubliclyAccessible(): boolean {
    return this.isActive() && this.getActivePublicLinks().length > 0;
  }
}
