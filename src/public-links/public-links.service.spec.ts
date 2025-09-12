import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicLinksService } from './public-links.service';
import { PublicLink } from './entities/public-link.entity';
import { Note } from '../notes/entities/note.entity';
import { NoteStatus } from '../common/enums/note-status.enum';

describe('PublicLinksService', () => {
  let service: PublicLinksService;
  let publicLinkRepository: Repository<PublicLink>;
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
    hasPublicLinks: jest.fn().mockReturnValue(true),
    getActivePublicLinks: jest.fn().mockReturnValue([]),
    getTotalViews: jest.fn().mockReturnValue(0),
    isPubliclyAccessible: jest.fn().mockReturnValue(true),
  };

  const mockPublicLink: PublicLink = {
    id: 'link-id',
    publicId: 'public-id',
    noteId: 'note-id',
    note: mockNote,
    createdById: 'user-id',
    createdBy: {} as any,
    description: 'Test link',
    viewCount: 0,
    lastAccessedAt: undefined,
    expiresAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    generatePublicId: jest.fn(),
    isExpired: jest.fn().mockReturnValue(false),
    isActive: jest.fn().mockReturnValue(true),
    recordAccess: jest.fn(),
    setExpiration: jest.fn(),
    makePermament: jest.fn(),
    isOwnedBy: jest.fn().mockReturnValue(true),
    getPublicUrl: jest.fn().mockReturnValue('/public/notes/public-id'),
    getStats: jest.fn().mockReturnValue({
      viewCount: 0,
      lastAccessedAt: undefined,
      createdAt: new Date(),
      isExpired: false,
      isActive: true,
    }),
  };

  const mockPublicLinkRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNoteRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicLinksService,
        {
          provide: getRepositoryToken(PublicLink),
          useValue: mockPublicLinkRepository,
        },
        {
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
      ],
    }).compile();

    service = module.get<PublicLinksService>(PublicLinksService);
    publicLinkRepository = module.get<Repository<PublicLink>>(
      getRepositoryToken(PublicLink),
    );
    noteRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPublicLink', () => {
    it('should create a public link successfully', async () => {
      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockPublicLinkRepository.create.mockReturnValue(mockPublicLink);
      mockPublicLinkRepository.save.mockResolvedValue(mockPublicLink);

      const result = await service.createPublicLink(
        'note-id',
        'user-id',
        'Test description',
      );

      expect(noteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'note-id', ownerId: 'user-id' },
        relations: ['owner'],
      });
      expect(publicLinkRepository.create).toHaveBeenCalled();
      expect(publicLinkRepository.save).toHaveBeenCalledWith(mockPublicLink);
      expect(result).toBe(mockPublicLink);
    });

    it('should throw NotFoundException when note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPublicLink('non-existent-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when note is disabled', async () => {
      const disabledNote = {
        ...mockNote,
        isActive: jest.fn().mockReturnValue(false),
      };
      mockNoteRepository.findOne.mockResolvedValue(disabledNote);

      await expect(
        service.createPublicLink('note-id', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByPublicId', () => {
    it('should return public link when found', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(mockPublicLink);

      const result = await service.getByPublicId('public-id');

      expect(publicLinkRepository.findOne).toHaveBeenCalledWith({
        where: { publicId: 'public-id' },
        relations: ['note', 'note.owner', 'createdBy'],
      });
      expect(result).toBe(mockPublicLink);
    });

    it('should return null when public link not found', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(null);

      const result = await service.getByPublicId('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null for empty public ID', async () => {
      const result = await service.getByPublicId('');

      expect(result).toBeNull();
      expect(publicLinkRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getByIdAndOwner', () => {
    it('should return public link when found and owned by user', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(mockPublicLink);

      const result = await service.getByIdAndOwner('link-id', 'user-id');

      expect(publicLinkRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'link-id', createdById: 'user-id' },
        relations: ['note', 'createdBy'],
      });
      expect(result).toBe(mockPublicLink);
    });

    it('should return null when public link not owned by user', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(null);

      const result = await service.getByIdAndOwner('link-id', 'other-user-id');

      expect(result).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated public links for user', async () => {
      const links = [mockPublicLink];
      const total = 1;
      mockPublicLinkRepository.findAndCount.mockResolvedValue([links, total]);

      const result = await service.findAllByUser('user-id');

      expect(publicLinkRepository.findAndCount).toHaveBeenCalledWith({
        where: { createdById: 'user-id' },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['note'],
      });
      expect(result).toEqual({
        links,
        total,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('findByNoteAndOwner', () => {
    it('should return public links for note when user owns it', async () => {
      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockPublicLinkRepository.find.mockResolvedValue([mockPublicLink]);

      const result = await service.findByNoteAndOwner('note-id', 'user-id');

      expect(noteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'note-id', ownerId: 'user-id' },
      });
      expect(publicLinkRepository.find).toHaveBeenCalledWith({
        where: { noteId: 'note-id', createdById: 'user-id' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockPublicLink]);
    });

    it('should throw NotFoundException when user does not own note', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByNoteAndOwner('note-id', 'other-user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteByPublicId', () => {
    it('should delete public link successfully', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(mockPublicLink);
      mockPublicLinkRepository.remove.mockResolvedValue(mockPublicLink);

      const result = await service.deleteByPublicId('link-id', 'user-id');

      expect(publicLinkRepository.remove).toHaveBeenCalledWith(mockPublicLink);
      expect(result).toBe(true);
    });

    it('should return false when public link not found', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteByPublicId(
        'non-existent-id',
        'user-id',
      );

      expect(result).toBe(false);
      expect(publicLinkRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('accessPublicNote', () => {
    it('should access public note and record view', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(mockPublicLink);
      mockPublicLinkRepository.save.mockResolvedValue(mockPublicLink);

      const result = await service.accessPublicNote('public-id');

      expect(mockPublicLink.recordAccess).toHaveBeenCalled();
      expect(publicLinkRepository.save).toHaveBeenCalledWith(mockPublicLink);
      expect(result).toBe(mockNote);
    });

    it('should return null when public link not found', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(null);

      const result = await service.accessPublicNote('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when public link is not active', async () => {
      const inactiveLink = {
        ...mockPublicLink,
        isActive: jest.fn().mockReturnValue(false),
      };
      mockPublicLinkRepository.findOne.mockResolvedValue(inactiveLink);

      const result = await service.accessPublicNote('public-id');

      expect(result).toBeNull();
      expect(publicLinkRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updatePublicLink', () => {
    it('should update public link successfully', async () => {
      const expiresAt = new Date();
      const updates = {
        description: 'Updated description',
        expiresAt,
      };
      mockPublicLinkRepository.findOne.mockResolvedValue(mockPublicLink);
      mockPublicLinkRepository.save.mockResolvedValue({
        ...mockPublicLink,
        ...updates,
      });

      const result = await service.updatePublicLink(
        'link-id',
        'user-id',
        updates,
      );

      expect(publicLinkRepository.save).toHaveBeenCalled();
      expect(mockPublicLink.description).toBe('Updated description');
    });

    it('should throw NotFoundException when public link not found', async () => {
      mockPublicLinkRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePublicLink('non-existent-id', 'user-id', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserLinkStats', () => {
    it('should return user link statistics', async () => {
      mockPublicLinkRepository.count.mockResolvedValue(5);
      const linksWithStats = [
        {
          ...mockPublicLink,
          isActive: () => true,
          isExpired: () => false,
          viewCount: 10,
        },
        {
          ...mockPublicLink,
          isActive: () => false,
          isExpired: () => true,
          viewCount: 5,
        },
      ];
      mockPublicLinkRepository.find.mockResolvedValue(linksWithStats);

      const result = await service.getUserLinkStats('user-id');

      expect(result).toEqual({
        totalLinks: 5,
        activeLinks: 1,
        expiredLinks: 1,
        totalViews: 15,
      });
    });
  });
});
