import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Note } from '../../notes/entities/note.entity';
import { User } from '../../users/entities/user.entity';
import { randomUUID } from 'crypto';

@Entity('public_links')
@Index(['publicId'], { unique: true }) // Unique index for public ID
@Index(['noteId']) // Index for note-based queries
@Index(['createdById']) // Index for user-based queries
export class PublicLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 36 })
  publicId: string;

  @ManyToOne(() => Note, (note) => note.publicLinks, {
    onDelete: 'CASCADE', // Delete public link when note is deleted
    nullable: false,
  })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column()
  noteId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE', // Delete public link when user is deleted
    nullable: false,
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ nullable: true })
  description?: string; // Optional description for the shared link

  @Column({ type: 'int', default: 0 })
  viewCount: number; // Track how many times the link has been accessed

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date; // Track when the link was last accessed

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date; // Optional expiration date for the link

  @BeforeInsert()
  generatePublicId() {
    if (!this.publicId) {
      this.publicId = randomUUID();
    }
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if the public link is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the public link is active (not expired and note is active)
   */
  isActive(): boolean {
    return !this.isExpired() && this.note?.isActive();
  }

  /**
   * Increment view count and update last accessed time
   */
  recordAccess(): void {
    this.viewCount++;
    this.lastAccessedAt = new Date();
  }

  /**
   * Set expiration date
   */
  setExpiration(expiresAt: Date): void {
    this.expiresAt = expiresAt;
  }

  /**
   * Remove expiration (make permanent)
   */
  makePermament(): void {
    this.expiresAt = undefined;
  }

  /**
   * Check if a user owns this public link
   */
  isOwnedBy(userId: string): boolean {
    return this.createdById === userId;
  }

  /**
   * Get the public URL (would be used with base URL in real implementation)
   */
  getPublicUrl(baseUrl: string = ''): string {
    return `${baseUrl}/public/notes/${this.publicId}`;
  }

  /**
   * Get sharing statistics
   */
  getStats() {
    return {
      viewCount: this.viewCount,
      lastAccessedAt: this.lastAccessedAt,
      createdAt: this.createdAt,
      isExpired: this.isExpired(),
      isActive: this.isActive(),
    };
  }
}
