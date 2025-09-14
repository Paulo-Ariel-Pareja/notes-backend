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

  async getUserNoteStats(ownerId: string) {
    const totalNotes = await this.noteRepository.count({ where: { ownerId } });
    const activeNotes = await this.noteRepository.count({
      where: { ownerId, status: NoteStatus.ACTIVE },
    });
    const disabledNotes = await this.noteRepository.count({
      where: { ownerId, status: NoteStatus.DISABLED },
    });

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

  async getRecentNotes(ownerId: string, limit: number = 5): Promise<Note[]> {
    return this.noteRepository.find({
      where: { ownerId, status: NoteStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      relations: ['publicLinks'],
    });
  }

  async findById(id: string): Promise<Note | null> {
    if (!id) {
      return null;
    }

    return this.noteRepository.findOne({
      where: { id },
      relations: ['owner', 'publicLinks'],
    });
  }

  async findByIdAndOwner(id: string, userId: string): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, ownerId: userId },
      relations: ['owner', 'publicLinks'],
    });
  }

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

    Object.assign(note, updates);
    return this.noteRepository.save(note);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const note = await this.findByIdAndOwner(id, userId);
    if (!note) {
      return false;
    }

    await this.noteRepository.remove(note);
    return true;
  }
}
