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
@Index(['publicId'], { unique: true })
@Index(['noteId'])
@Index(['createdById'])
export class PublicLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 36 })
  publicId: string;

  @ManyToOne(() => Note, (note) => note.publicLinks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column()
  noteId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

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

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return !this.isExpired() && this.note?.isActive();
  }

  recordAccess(): void {
    this.viewCount++;
    this.lastAccessedAt = new Date();
  }

  setExpiration(expiresAt: Date): void {
    this.expiresAt = expiresAt;
  }

  makePermament(): void {
    this.expiresAt = undefined;
  }

  isOwnedBy(userId: string): boolean {
    return this.createdById === userId;
  }

  getPublicUrl(baseUrl: string = ''): string {
    return `${baseUrl}/public/notes/${this.publicId}`;
  }

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
