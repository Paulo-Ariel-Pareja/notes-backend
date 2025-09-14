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
@Index(['ownerId', 'status'])
@Index(['status'])
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
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => PublicLink, (publicLink) => publicLink.note, {
    cascade: true,
  })
  publicLinks: PublicLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isActive(): boolean {
    return this.status === NoteStatus.ACTIVE;
  }

  isDisabled(): boolean {
    return this.status === NoteStatus.DISABLED;
  }

  enable(): void {
    this.status = NoteStatus.ACTIVE;
  }

  disable(): void {
    this.status = NoteStatus.DISABLED;
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  getSummary(maxLength: number = 100): string {
    if (this.description.length <= maxLength) {
      return this.description;
    }
    return this.description.substring(0, maxLength) + '...';
  }

  getWordCount(): number {
    return this.description
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  getCharacterCount(): number {
    return this.description.length;
  }

  hasPublicLinks(): boolean {
    return this.publicLinks && this.publicLinks.length > 0;
  }

  getActivePublicLinks(): PublicLink[] {
    if (!this.publicLinks) return [];
    return this.publicLinks.filter((link) => link.isActive());
  }

  getTotalViews(): number {
    if (!this.publicLinks) return 0;
    return this.publicLinks.reduce((total, link) => total + link.viewCount, 0);
  }

  isPubliclyAccessible(): boolean {
    return this.isActive() && this.getActivePublicLinks().length > 0;
  }
}
