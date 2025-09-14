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
    cascade: true,
  })
  notes: Note[];

  @OneToMany(() => PublicLink, (publicLink) => publicLink.createdBy, {
    cascade: true,
  })
  publicLinks: PublicLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isUser(): boolean {
    return this.role === UserRole.USER;
  }

  getDisplayName(): string {
    return this.email.split('@')[0];
  }

  getPublicLinks(): PublicLink[] {
    return this.publicLinks || [];
  }

  getActivePublicLinks(): PublicLink[] {
    return this.getPublicLinks().filter((link) => link.isActive());
  }

  getPublicLinkCount(): number {
    return this.getPublicLinks().length;
  }

  hasPublicLinks(): boolean {
    return this.getPublicLinkCount() > 0;
  }
}
