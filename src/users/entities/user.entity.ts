import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { Note } from '../../notes/entities/note.entity';
import { PublicLink } from '../../public-links/entities/public-link.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => Note, (note) => note.owner, {
    cascade: true, // Cascade operations to notes
  })
  notes: Note[];

  @OneToMany(() => PublicLink, (publicLink) => publicLink.createdBy, {
    cascade: true, // Cascade operations to public links
  })
  publicLinks: PublicLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user is regular user
   */
  isUser(): boolean {
    return this.role === UserRole.USER;
  }

  /**
   * Get user's display name (email without domain for privacy)
   */
  getDisplayName(): string {
    return this.email.split('@')[0];
  }

  /**
   * Get all public links created by this user
   */
  getPublicLinks(): PublicLink[] {
    return this.publicLinks || [];
  }

  /**
   * Get active public links created by this user
   */
  getActivePublicLinks(): PublicLink[] {
    return this.getPublicLinks().filter((link) => link.isActive());
  }

  /**
   * Get total number of public links created by this user
   */
  getPublicLinkCount(): number {
    return this.getPublicLinks().length;
  }

  /**
   * Check if user has any public links
   */
  hasPublicLinks(): boolean {
    return this.getPublicLinkCount() > 0;
  }
}
