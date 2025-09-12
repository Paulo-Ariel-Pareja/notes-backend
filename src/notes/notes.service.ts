import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { NoteStatus } from '../common/enums/note-status.enum';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  /**
   * Create a new note
   * @param title - Note title
   * @param description - Note description
   * @param ownerId - User ID who owns the note
   * @returns Created note
   */
  async create(
    title: string,
    description: string,
    ownerId: string,
  ): Promise<Note> {
    if (!ownerId) throw new BadRequestException('Owner ID is required');

    const note = this.noteRepository.create({
      title: title.trim(),
      description: description.trim(),
      ownerId,
      status: NoteStatus.ACTIVE,
    });

    return this.noteRepository.save(note);
  }

  /**
   * Search notes by title or description
   * @param ownerId - User ID
   * @param searchTerm - Search term
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated search results
   */
  async search(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
    status?: NoteStatus,
    searchTerm?: string,
  ): Promise<{
    notes: Note[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const search = searchTerm ? searchTerm.trim() : '';
    const skip = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const queryBuilder = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.publicLinks', 'publicLinks')
      .where('note.ownerId = :ownerId', { ownerId })
      .andWhere(
        '(LOWER(note.title) LIKE LOWER(:searchPattern) OR LOWER(note.description) LIKE LOWER(:searchPattern))',
        { searchPattern },
      )
      .andWhere('note.status = :status', { status })
      .orderBy('note.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [notes, total] = await queryBuilder.getManyAndCount();

    return {
      notes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get note statistics for a user
   * @param ownerId - User ID
   * @returns Note statistics
   */
  async getUserNoteStats(ownerId: string) {
    const totalNotes = await this.noteRepository.count({ where: { ownerId } });
    const activeNotes = await this.noteRepository.count({
      where: { ownerId, status: NoteStatus.ACTIVE },
    });
    const disabledNotes = await this.noteRepository.count({
      where: { ownerId, status: NoteStatus.DISABLED },
    });

    // Get notes with public links to calculate shared notes
    const notesWithLinks = await this.noteRepository.find({
      where: { ownerId },
      relations: ['publicLinks'],
    });

    const sharedNotes = notesWithLinks.filter((note) =>
      note.hasPublicLinks(),
    ).length;
    const totalViews = notesWithLinks.reduce(
      (sum, note) => sum + note.getTotalViews(),
      0,
    );

    return {
      totalNotes,
      activeNotes,
      disabledNotes,
      sharedNotes,
      totalViews,
    };
  }

  /**
   * Get recent notes for a user
   * @param ownerId - User ID
   * @param limit - Number of recent notes to return
   * @returns Recent notes
   */
  async getRecentNotes(ownerId: string, limit: number = 5): Promise<Note[]> {
    return this.noteRepository.find({
      where: { ownerId, status: NoteStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      relations: ['publicLinks'],
    });
  }

  /**
   * Find note by ID
   * @param id - Note ID
   * @returns Note or null
   */
  async findById(id: string): Promise<Note | null> {
    if (!id) {
      return null;
    }

    return this.noteRepository.findOne({
      where: { id },
      relations: ['owner', 'publicLinks'],
    });
  }

  /**
   * Find note by ID with ownership validation
   * @param id - Note ID
   * @param userId - User ID to validate ownership
   * @returns Note if owned by user
   */
  async findByIdAndOwner(id: string, userId: string): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, ownerId: userId },
      relations: ['owner', 'publicLinks'],
    });
  }

  /**
   * Update a note
   * @param id - Note ID
   * @param updates - Partial note data to update
   * @param userId - User ID for ownership validation
   * @returns Updated note
   */
  async update(
    id: string,
    updates: Partial<Note>,
    userId: string,
  ): Promise<Note> {
    const note = await this.findByIdAndOwner(id, userId);
    if (!note) {
      throw new NotFoundException(
        'Note not found or you do not have permission to update it',
      );
    }

    if (updates.title) updates.title = updates.title.trim();

    if (updates.description) updates.description = updates.description.trim();

    // Prevent changing owner
    delete updates.ownerId;
    delete updates.owner;

    // Apply updates
    Object.assign(note, updates);
    return this.noteRepository.save(note);
  }

  /**
   * Delete a note
   * @param id - Note ID
   * @param userId - User ID for ownership validation
   * @returns True if deleted, false if not found
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const note = await this.findByIdAndOwner(id, userId);
    if (!note) {
      return false;
    }

    await this.noteRepository.remove(note);
    return true;
  }

  // REVISAR DESDE ACA!!

  /**
   * Find all notes for a user with pagination
   * @param ownerId - User ID
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param status - Optional status filter
   * @returns Paginated notes
   */
  /*   
//DEPRECADO, UNIFICADO EN SEARCH
async findAllByOwner(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
    status?: NoteStatus,
  ): Promise<{
    notes: Note[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const whereCondition: any = { ownerId };

    if (status) {
      whereCondition.status = status;
    }

    const [notes, total] = await this.noteRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
     // relations: ['publicLinks'],
    });

    return {
      notes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } */

  /**
   * Find all active notes (for admin)
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated active notes
   */
  async findAllActive(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notes: Note[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [notes, total] = await this.noteRepository.findAndCount({
      where: { status: NoteStatus.ACTIVE },
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
      relations: ['owner', 'publicLinks'],
    });

    return {
      notes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
