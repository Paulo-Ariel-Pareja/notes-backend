import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { NoteStatus } from '../common/enums/note-status.enum';

describe('NotesService', () => {
  let service: NotesService;
  let noteRepository: Repository<Note>;

  const mockNote: Note = {
    id: 'note-id',
    title: 'Test Note',
    description: 'Test description',
    status: NoteStatus.ACTIVE,
    ownerId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: {} as any,
    publicLinks: [],
    isActive: jest.fn().mockReturnValue(true),
    isDisabled: jest.fn().mockReturnValue(false),
    enable: jest.fn(),
    disable: jest.fn(),
    isOwnedBy: jest.fn().mockReturnValue(true),
    getSummary: jest.fn().mockReturnValue('Test description'),
    getWordCount: jest.fn().mockReturnValue(2),
    getCharacterCount: jest.fn().mockReturnValue(16),
    hasPublicLinks: jest.fn().mockReturnValue(false),
    getActivePublicLinks: jest.fn().mockReturnValue([]),
    getTotalViews: jest.fn().mockReturnValue(0),
    isPubliclyAccessible: jest.fn().mockReturnValue(false),
  };

  const mockNoteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    noteRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a note successfully', async () => {
      const title = 'Test Note';
      const description = 'Test description';
      const ownerId = 'user-id';

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);

      const result = await service.create(title, description, ownerId);

      expect(noteRepository.create).toHaveBeenCalledWith({
        title,
        description,
        ownerId,
        status: NoteStatus.ACTIVE,
      });
      expect(noteRepository.save).toHaveBeenCalledWith(mockNote);
      expect(result).toBe(mockNote);
    });

    it('should throw BadRequestException for missing owner ID', async () => {
      await expect(service.create('title', 'description', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should trim title and description', async () => {
      const title = '  Test Note  ';
      const description = '  Test description  ';
      const ownerId = 'user-id';

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);

      await service.create(title, description, ownerId);

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Test Note',
        description: 'Test description',
        ownerId,
        status: NoteStatus.ACTIVE,
      });
    });
  });

  describe('findById', () => {
    it('should return note when found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(mockNote);

      const result = await service.findById('note-id');

      expect(noteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'note-id' },
        relations: ['owner', 'publicLinks'],
      });
      expect(result).toBe(mockNote);
    });

    it('should return null when note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null for empty id', async () => {
      const result = await service.findById('');

      expect(result).toBeNull();
      expect(noteRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByIdAndOwner', () => {
    it('should return note when found and owned by user', async () => {
      mockNoteRepository.findOne.mockResolvedValue(mockNote);

      const result = await service.findByIdAndOwner('note-id', 'user-id');

      expect(noteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'note-id', ownerId: 'user-id' },
        relations: ['owner', 'publicLinks'],
      });
      expect(result).toBe(mockNote);
    });

    it('should return null when note not owned by user', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.findByIdAndOwner('note-id', 'other-user-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update note successfully', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
      };
      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockNoteRepository.save.mockResolvedValue({ ...mockNote, ...updates });

      const result = await service.update('note-id', updates, 'user-id');

      expect(noteRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'Updated' }, 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent changing owner', async () => {
      const updates = { title: 'Updated Title', ownerId: 'other-user-id' };
      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);

      await service.update('note-id', updates, 'user-id');

      // ownerId should be removed from updates
      expect(mockNote.ownerId).toBe('user-id');
    });
  });

  describe('delete', () => {
    it('should delete note successfully', async () => {
      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockNoteRepository.remove.mockResolvedValue(mockNote);

      const result = await service.delete('note-id', 'user-id');

      expect(noteRepository.remove).toHaveBeenCalledWith(mockNote);
      expect(result).toBe(true);
    });

    it('should return false when note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.delete('non-existent-id', 'user-id');

      expect(result).toBe(false);
      expect(noteRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search notes by title and description', async () => {
      const notes = [mockNote];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([notes, 1]),
      };

      mockNoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(
        'user-id',
        undefined,
        undefined,
        NoteStatus.ACTIVE,
        'Test',
      );

      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        notes,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should return all notes when search term is empty', async () => {
      const notes = [mockNote];
      const total = 1;
      mockNoteRepository.findAndCount.mockResolvedValue([notes, total]);

      const result = await service.search('user-id', 1, 10);

      expect(result).toEqual({
        notes,
        total,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('getUserNoteStats', () => {
    it('should return user note statistics', async () => {
      mockNoteRepository.count
        .mockResolvedValueOnce(10) // total notes
        .mockResolvedValueOnce(8) // active notes
        .mockResolvedValueOnce(2); // disabled notes

      const notesWithLinks = [
        { ...mockNote, hasPublicLinks: () => true, getTotalViews: () => 5 },
        { ...mockNote, hasPublicLinks: () => false, getTotalViews: () => 0 },
      ];
      mockNoteRepository.find.mockResolvedValue(notesWithLinks);

      const result = await service.getUserNoteStats('user-id');

      expect(result).toEqual({
        totalNotes: 10,
        activeNotes: 8,
        disabledNotes: 2,
        sharedNotes: 1,
        totalViews: 5,
      });
    });
  });


  describe('getRecentNotes', () => {
    it('should return recent notes for user', async () => {
      const recentNotes = [mockNote];
      mockNoteRepository.find.mockResolvedValue(recentNotes);

      const result = await service.getRecentNotes('user-id');

      expect(noteRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 'user-id', status: NoteStatus.ACTIVE },
        order: { updatedAt: 'DESC' },
        take: 5,
        relations: ['publicLinks'],
      });
      expect(result).toBe(recentNotes);
    });
  });

  describe('findAllActive', () => {
    it('should return all notes for all users', async () => {
      const notes = [mockNote];
      const total = 1;
      mockNoteRepository.findAndCount.mockResolvedValue([notes, total]);

      const result = await service.findAllActive();

      expect(noteRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: NoteStatus.ACTIVE },
        skip: 0,
        take: 10,
        order: { updatedAt: 'DESC' },
        relations: ['owner', 'publicLinks'],
      });
      expect(result).toEqual({
        notes,
        total,
        page: 1,
        totalPages: 1,
      });
    });
  });
});
