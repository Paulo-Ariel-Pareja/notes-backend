import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicLink } from './entities/public-link.entity';
import { Note } from '../notes/entities/note.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class PublicLinksService {
  constructor(
    @InjectRepository(PublicLink)
    private readonly publicLinkRepository: Repository<PublicLink>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  async createPublicLink(
    noteId: string,
    userId: string,
    description?: string,
    expiresAt?: Date,
  ): Promise<PublicLink> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, ownerId: userId },
      relations: ['owner'],
    });

    if (!note)
      throw new NotFoundException(
        'Note not found or you do not have permission to share it',
      );

    if (!note.isActive())
      throw new BadRequestException('Cannot share a disabled note');

    const publicId = randomUUID();

    const publicLink = this.publicLinkRepository.create({
      publicId,
      noteId,
      createdById: userId,
      description: description?.trim(),
      expiresAt,
    });

    return this.publicLinkRepository.save(publicLink);
  }

  async getByPublicId(publicId: string): Promise<PublicLink | null> {
    if (!publicId) {
      return null;
    }

    return this.publicLinkRepository.findOne({
      where: { publicId },
      relations: ['note', 'note.owner', 'createdBy'],
    });
  }

  async getByIdAndOwner(
    id: string,
    userId: string,
  ): Promise<PublicLink | null> {
    return this.publicLinkRepository.findOne({
      where: { id, createdById: userId },
      relations: ['note', 'createdBy'],
    });
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    links: PublicLink[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [links, total] = await this.publicLinkRepository.findAndCount({
      where: { createdById: userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['note'],
    });

    return {
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByNoteAndOwner(
    noteId: string,
    userId: string,
  ): Promise<PublicLink[]> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, ownerId: userId },
    });

    if (!note) {
      throw new NotFoundException(
        'Note not found or you do not have permission to view its links',
      );
    }

    return this.publicLinkRepository.find({
      where: { noteId, createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByPublicId(publicId: string, userId: string): Promise<boolean> {
    const publicLink = await this.publicLinkRepository.findOne({
      where: { publicId, createdById: userId },
    });

    if (!publicLink) {
      return false;
    }

    await this.publicLinkRepository.remove(publicLink);
    return true;
  }

  async accessPublicNote(publicId: string): Promise<Note | null> {
    const publicLink = await this.getByPublicId(publicId);
    if (!publicLink) return null;

    if (!publicLink.isActive()) return null;

    publicLink.recordAccess();
    await this.publicLinkRepository.save(publicLink);

    return publicLink.note;
  }

  async updatePublicLink(
    id: string,
    userId: string,
    updates: { description?: string; expiresAt?: Date },
  ): Promise<PublicLink> {
    const publicLink = await this.getByIdAndOwner(id, userId);
    if (!publicLink) {
      throw new NotFoundException(
        'Public link not found or you do not have permission to update it',
      );
    }

    if (updates.description !== undefined) {
      publicLink.description = updates.description?.trim();
    }

    if (updates.expiresAt !== undefined) {
      publicLink.expiresAt = updates.expiresAt;
    }

    return this.publicLinkRepository.save(publicLink);
  }

  async getUserLinkStats(userId: string) {
    const totalLinks = await this.publicLinkRepository.count({
      where: { createdById: userId },
    });

    const links = await this.publicLinkRepository.find({
      where: { createdById: userId },
      relations: ['note'],
    });

    const activeLinks = links.filter((link) => link.isActive()).length;
    const expiredLinks = links.filter((link) => link.isExpired()).length;
    const totalViews = links.reduce((sum, link) => sum + link.viewCount, 0);

    return {
      totalLinks,
      activeLinks,
      expiredLinks,
      totalViews,
    };
  }
}
