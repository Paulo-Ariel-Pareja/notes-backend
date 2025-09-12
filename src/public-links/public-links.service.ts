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

  /**
   * Create a public link for a note
   * @param noteId - Note ID to share
   * @param userId - User ID (must be note owner)
   * @param description - Optional description for the link
   * @param expiresAt - Optional expiration date
   * @returns Created public link
   */
  async createPublicLink(
    noteId: string,
    userId: string,
    description?: string,
    expiresAt?: Date,
  ): Promise<PublicLink> {
    // Verify note exists and user owns it
    const note = await this.noteRepository.findOne({
      where: { id: noteId, ownerId: userId },
      relations: ['owner'],
    });

    if (!note)
      throw new NotFoundException(
        'Note not found or you do not have permission to share it',
      );

    // Check if note is active
    if (!note.isActive()) throw new BadRequestException('Cannot share a disabled note');

    // Generate unique public ID
    const publicId = randomUUID();

    // Create public link
    const publicLink = this.publicLinkRepository.create({
      publicId,
      noteId,
      createdById: userId,
      description: description?.trim(),
      expiresAt,
    });

    return this.publicLinkRepository.save(publicLink);
  }

  /**
   * Get public link by public ID
   * @param publicId - Public ID
   * @returns Public link with note data
   */
  async getByPublicId(publicId: string): Promise<PublicLink | null> {
    if (!publicId) {
      return null;
    }

    return this.publicLinkRepository.findOne({
      where: { publicId },
      relations: ['note', 'note.owner', 'createdBy'],
    });
  }

  /**
   * Get public link by ID with ownership validation
   * @param id - Public link ID
   * @param userId - User ID for ownership validation
   * @returns Public link if owned by user
   */
  async getByIdAndOwner(
    id: string,
    userId: string,
  ): Promise<PublicLink | null> {
    return this.publicLinkRepository.findOne({
      where: { id, createdById: userId },
      relations: ['note', 'createdBy'],
    });
  }

  /**
   * Get all public links created by a user
   * @param userId - User ID
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated public links
   */
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

  /**
   * Get all public links for a specific note
   * @param noteId - Note ID
   * @param userId - User ID for ownership validation
   * @returns Public links for the note
   */
  async findByNoteAndOwner(
    noteId: string,
    userId: string,
  ): Promise<PublicLink[]> {
    // First verify user owns the note
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

  /**
   * Delete a public link
   * @param id - Public link ID
   * @param userId - User ID for ownership validation
   * @returns True if deleted, false if not found
   */
/*   async deletePublicLink(id: string, userId: string): Promise<boolean> {
    const publicLink = await this.getByIdAndOwner(id, userId);
    if (!publicLink) {
      return false;
    }

    await this.publicLinkRepository.remove(publicLink);
    return true;
  } */

  /**
   * Delete public link by public ID (for owner)
   * @param publicId - Public ID
   * @param userId - User ID for ownership validation
   * @returns True if deleted, false if not found
   */
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

  /**
   * Access a public note (increment view count)
   * @param publicId - Public ID
   * @returns Note data if accessible
   */
  async accessPublicNote(publicId: string): Promise<Note | null> {
    const publicLink = await this.getByPublicId(publicId);
    if (!publicLink) return null;

    if (!publicLink.isActive()) return null;

    // Record access
    publicLink.recordAccess();
    await this.publicLinkRepository.save(publicLink);

    return publicLink.note;
  }

  /**
   * Update public link settings
   * @param id - Public link ID
   * @param userId - User ID for ownership validation
   * @param updates - Updates to apply
   * @returns Updated public link
   */
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

    // Apply updates
    if (updates.description !== undefined) {
      publicLink.description = updates.description?.trim();
    }

    if (updates.expiresAt !== undefined) {
      publicLink.expiresAt = updates.expiresAt;
    }

    return this.publicLinkRepository.save(publicLink);
  }

  /**
   * Set expiration for a public link
   * @param id - Public link ID
   * @param userId - User ID for ownership validation
   * @param expiresAt - Expiration date
   * @returns Updated public link
   */
/*   async setExpiration(
    id: string,
    userId: string,
    expiresAt: Date,
  ): Promise<PublicLink> {
    const publicLink = await this.getByIdAndOwner(id, userId);
    if (!publicLink) {
      throw new NotFoundException(
        'Public link not found or you do not have permission to update it',
      );
    }

    publicLink.setExpiration(expiresAt);
    return this.publicLinkRepository.save(publicLink);
  } */

  /**
   * Make public link permanent (remove expiration)
   * @param id - Public link ID
   * @param userId - User ID for ownership validation
   * @returns Updated public link
   */
/*   async makePermanent(id: string, userId: string): Promise<PublicLink> {
    const publicLink = await this.getByIdAndOwner(id, userId);
    if (!publicLink) {
      throw new NotFoundException(
        'Public link not found or you do not have permission to update it',
      );
    }

    publicLink.makePermament();
    return this.publicLinkRepository.save(publicLink);
  } */

  /**
   * Get public link statistics for a user
   * @param userId - User ID
   * @returns Public link statistics
   */
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

  /**
   * Get system-wide public link statistics (for admin)
   * @returns System public link statistics
   */
/*   async getSystemLinkStats() {
    const totalLinks = await this.publicLinkRepository.count();

    const links = await this.publicLinkRepository.find({
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
  } */

  /**
   * Clean up expired links (utility method)
   * @returns Number of cleaned up links
   */
/*   async cleanupExpiredLinks(): Promise<number> {
    const expiredLinks = await this.publicLinkRepository
      .createQueryBuilder('link')
      .where('link.expiresAt IS NOT NULL')
      .andWhere('link.expiresAt < :now', { now: new Date() })
      .getMany();

    if (expiredLinks.length === 0) {
      return 0;
    }

    await this.publicLinkRepository.remove(expiredLinks);
    return expiredLinks.length;
  } */

  /**
   * Check if user owns a public link
   * @param publicLinkId - Public link ID
   * @param userId - User ID
   * @returns True if user owns the public link
   */
/*   async isOwner(publicLinkId: string, userId: string): Promise<boolean> {
    const count = await this.publicLinkRepository.count({
      where: { id: publicLinkId, createdById: userId },
    });
    return count > 0;
  } */
}
