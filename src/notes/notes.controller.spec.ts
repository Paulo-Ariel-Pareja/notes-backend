import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { PolicyEngineService } from '../abac/policy-engine.service';
import { PublicLinksService } from '../public-links/public-links.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { CreatePublicLinkDto, UpdatePublicLinkDto } from '../public-links/dto';
import { Note } from './entities/note.entity';
import { User } from '../users/entities/user.entity';
import { PublicLink } from '../public-links/entities/public-link.entity';
import { NoteStatus } from '../common/enums/note-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

describe('NotesController', () => {
  let controller: NotesController;
  let notesService: NotesService;

  const mockUser: User = {
    id: 'user-id',
    email: 'user@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [],
    publicLinks: [],
    isAdmin: jest.fn().mockReturnValue(false),
    isUser: jest.fn().mockReturnValue(true),
    getDisplayName: jest.fn().mockReturnValue('user'),
    getPublicLinks: jest.fn().mockReturnValue([]),
    getActivePublicLinks: jest.fn().mockReturnValue([]),
    getPublicLinkCount: jest.fn().mockReturnValue(0),
    hasPublicLinks: jest.fn().mockReturnValue(false),
  };

  const mockNote: Note = {
    id: 'note-id',
    title: 'Test Note',
    description: 'Test description',
    status: NoteStatus.ACTIVE,
    ownerId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: mockUser,
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

  const mockNotesService = {
    create: jest.fn(),
    findByIdAndOwner: jest.fn(),
    findAllByOwner: jest.fn(),
    findAllActive: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    search: jest.fn(),
    getUserNoteStats: jest.fn(),
    getSystemNoteStats: jest.fn(),
    getRecentNotes: jest.fn(),
    getNotesByStatus: jest.fn(),
    bulkUpdateStatus: jest.fn(),
  };

  const mockPublicLinksService = {
    createPublicLink: jest.fn(),
    findAllByUser: jest.fn(),
    findByNoteAndOwner: jest.fn(),
    getByPublicId: jest.fn(),
    updatePublicLink: jest.fn(),
    deleteByPublicId: jest.fn(),
    getUserLinkStats: jest.fn(),
    getMostViewed: jest.fn(),
  };

  const mockPolicyEngineService = {
    evaluate: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
        {
          provide: PublicLinksService,
          useValue: mockPublicLinksService,
        },
        {
          provide: PolicyEngineService,
          useValue: mockPolicyEngineService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    notesService = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('NotesController', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    describe('create', () => {
      it('should create a note successfully', async () => {
        const createNoteDto: CreateNoteDto = {
          title: 'Test Note',
          description: 'Test description',
        };

        mockNotesService.create.mockResolvedValue(mockNote);

        const result = await controller.create(createNoteDto, mockUser);

        expect(notesService.create).toHaveBeenCalledWith(
          createNoteDto.title,
          createNoteDto.description,
          mockUser.id,
        );
        expect(result.title).toBe(mockNote.title);
        expect(result.description).toBe(mockNote.description);
      });
    });

    describe('findAll', () => {
      it('should return paginated notes for user', async () => {
        const searchDto = { page: 1, limit: 10 };
        const paginatedResult = {
          notes: [mockNote],
          total: 1,
          page: 1,
          totalPages: 1,
        };

        mockNotesService.search.mockResolvedValue(paginatedResult);

        const result = await controller.findAll(mockUser, searchDto);

        expect(notesService.search).toHaveBeenCalledWith(
          mockUser.id,
          searchDto.page,
          searchDto.limit,
          undefined,
          undefined,
        );
        expect(result.notes).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should search notes when search term is provided', async () => {
        const searchDto = { search: 'test', page: 1, limit: 10 };
        const searchResult = {
          notes: [mockNote],
          total: 1,
          page: 1,
          totalPages: 1,
        };

        mockNotesService.search.mockResolvedValue(searchResult);

        const result = await controller.findAll(mockUser, searchDto);

        expect(notesService.search).toHaveBeenCalledWith(
          mockUser.id,
          searchDto.page,
          searchDto.limit,
          undefined,
          searchDto.search,
        );
        expect(result.notes).toHaveLength(1);
      });
    });

    describe('getStats', () => {
      it('should return user note statistics', async () => {
        const stats = {
          totalNotes: 5,
          activeNotes: 4,
          disabledNotes: 1,
          sharedNotes: 2,
          totalViews: 100,
        };

        mockNotesService.getUserNoteStats.mockResolvedValue(stats);

        const result = await controller.getStats(mockUser);

        expect(notesService.getUserNoteStats).toHaveBeenCalledWith(mockUser.id);
        expect(result.totalNotes).toBe(5);
        expect(result.activeNotes).toBe(4);
      });
    });

    describe('findOne', () => {
      it('should return note by ID', async () => {
        mockNotesService.findByIdAndOwner.mockResolvedValue(mockNote);

        const result = await controller.findOne('note-id', mockUser);

        expect(notesService.findByIdAndOwner).toHaveBeenCalledWith(
          'note-id',
          mockUser.id,
        );
        expect(result.title).toBe(mockNote.title);
      });

      it('should throw error when note not found', async () => {
        mockNotesService.findByIdAndOwner.mockResolvedValue(null);

        await expect(
          controller.findOne('non-existent-id', mockUser),
        ).rejects.toThrow('Note not found');
      });
    });

    describe('update', () => {
      it('should update note successfully', async () => {
        const updateNoteDto: UpdateNoteDto = {
          title: 'Updated Title',
        };

        const updatedNote = { ...mockNote, title: 'Updated Title' };
        mockNotesService.update.mockResolvedValue(updatedNote);

        const result = await controller.update(
          'note-id',
          updateNoteDto,
          mockUser,
        );

        expect(notesService.update).toHaveBeenCalledWith(
          'note-id',
          updateNoteDto,
          mockUser.id,
        );
        expect(result.title).toBe('Updated Title');
      });
    });

    describe('remove', () => {
      it('should delete note successfully', async () => {
        mockNotesService.delete.mockResolvedValue(true);

        const result = await controller.remove('note-id', mockUser);

        expect(notesService.delete).toHaveBeenCalledWith(
          'note-id',
          mockUser.id,
        );
        expect(result.message).toBe('Note deleted successfully');
      });

      it('should NOT throw error when note not found', async () => {
        mockNotesService.delete.mockResolvedValue(false);
        const result = await controller.remove('non-existent-id', mockUser);
        expect(notesService.delete).toHaveBeenCalledWith(
          'non-existent-id',
          mockUser.id,
        );
        expect(result.message).toBe('Note deleted successfully');
      });
    });

    describe('getRecent', () => {
      it('should return recent notes', async () => {
        const recentNotes = [mockNote];
        mockNotesService.getRecentNotes.mockResolvedValue(recentNotes);

        const result = await controller.getRecent(mockUser, 5);

        expect(notesService.getRecentNotes).toHaveBeenCalledWith(
          mockUser.id,
          5,
        );
        expect(result).toHaveLength(1);
      });
    });

    describe('shareNote', () => {
      it('should create public link for note successfully', async () => {
        const createPublicLinkDto: CreatePublicLinkDto = {
          description: 'Test public link',
        };

        const mockPublicLink: PublicLink = {
          id: 'link-id',
          publicId: 'public-id',
          noteId: 'note-id',
          note: mockNote,
          createdById: 'user-id',
          createdBy: mockUser,
          description: 'Test public link',
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

        mockPublicLinksService.createPublicLink.mockResolvedValue(
          mockPublicLink,
        );

        const result = await controller.shareNote(
          'note-id',
          createPublicLinkDto,
          mockUser,
        );

        expect(mockPublicLinksService.createPublicLink).toHaveBeenCalledWith(
          'note-id',
          mockUser.id,
          createPublicLinkDto.description,
          undefined,
        );
        expect(result.publicId).toBe('public-id');
        expect(result.description).toBe('Test public link');
      });

      it('should create public link with expiration date', async () => {
        const expirationDate = new Date('2025-12-31');
        const createPublicLinkDto: CreatePublicLinkDto = {
          description: 'Test public link',
          expiresAt: expirationDate.toISOString(),
        };

        const mockPublicLink: PublicLink = {
          id: 'link-id',
          publicId: 'public-id',
          noteId: 'note-id',
          note: mockNote,
          createdById: 'user-id',
          createdBy: mockUser,
          description: 'Test public link',
          viewCount: 0,
          lastAccessedAt: undefined,
          expiresAt: expirationDate,
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

        mockPublicLinksService.createPublicLink.mockResolvedValue(
          mockPublicLink,
        );

        const result = await controller.shareNote(
          'note-id',
          createPublicLinkDto,
          mockUser,
        );

        expect(mockPublicLinksService.createPublicLink).toHaveBeenCalledWith(
          'note-id',
          mockUser.id,
          createPublicLinkDto.description,
          expirationDate,
        );
        expect(result.expiresAt).toEqual(expirationDate);
      });
    });

    describe('getSharedNotes', () => {
      it('should return paginated public links for user', async () => {
        const mockPublicLink: PublicLink = {
          id: 'link-id',
          publicId: 'public-id',
          noteId: 'note-id',
          note: mockNote,
          createdById: 'user-id',
          createdBy: mockUser,
          description: 'Test public link',
          viewCount: 5,
          lastAccessedAt: new Date(),
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
            viewCount: 5,
            lastAccessedAt: new Date(),
            createdAt: new Date(),
            isExpired: false,
            isActive: true,
          }),
        };

        const paginatedResult = {
          links: [mockPublicLink],
          total: 1,
          page: 1,
          totalPages: 1,
        };

        mockPublicLinksService.findAllByUser.mockResolvedValue(paginatedResult);

        const result = await controller.getSharedNotes(mockUser, 1, 10);

        expect(mockPublicLinksService.findAllByUser).toHaveBeenCalledWith(
          mockUser.id,
          1,
          10,
        );
        expect(result.links).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
      });
    });

    describe('updateSharedNote', () => {
      it('should update public link successfully', async () => {
        const updatePublicLinkDto: UpdatePublicLinkDto = {
          description: 'Updated description',
          expiresAt: new Date('2025-12-31').toISOString(),
        };

        const mockPublicLink: PublicLink = {
          id: 'link-id',
          publicId: 'public-id',
          noteId: 'note-id',
          note: mockNote,
          createdById: 'user-id',
          createdBy: mockUser,
          description: 'Test public link',
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

        const updatedPublicLink = {
          ...mockPublicLink,
          description: 'Updated description',
        };

        mockPublicLinksService.getByPublicId.mockResolvedValue(mockPublicLink);
        mockPublicLinksService.updatePublicLink.mockResolvedValue(
          updatedPublicLink,
        );

        const result = await controller.updateSharedNote(
          'public-id',
          updatePublicLinkDto,
          mockUser,
        );

        expect(mockPublicLinksService.getByPublicId).toHaveBeenCalledWith(
          'public-id',
        );
        expect(result.description).toBe('Updated description');
      });

      it('should throw error when public link not found or not owned', async () => {
        const updatePublicLinkDto: UpdatePublicLinkDto = {
          description: 'Updated description',
        };

        mockPublicLinksService.getByPublicId.mockResolvedValue(null);

        await expect(
          controller.updateSharedNote(
            'non-existent-id',
            updatePublicLinkDto,
            mockUser,
          ),
        ).rejects.toThrow(
          'Public link not found or you do not have permission to update it',
        );
      });
    });

    describe('removeSharedNote', () => {
      it('should delete public link successfully', async () => {
        mockPublicLinksService.deleteByPublicId.mockResolvedValue(true);

        const result = await controller.removeSharedNote('public-id', mockUser);

        expect(mockPublicLinksService.deleteByPublicId).toHaveBeenCalledWith(
          'public-id',
          mockUser.id,
        );
        expect(result.message).toBe('Public link deleted successfully');
      });

      it('should NOT throw error when public link not found', async () => {
        mockPublicLinksService.deleteByPublicId.mockResolvedValue(false);
        const result = await controller.removeSharedNote(
          'non-existent-id',
          mockUser,
        );

        expect(result.message).toBe('Public link deleted successfully');
      });

      describe('getSharingStats', () => {
        it('should return sharing statistics for user', async () => {
          const stats = {
            totalLinks: 5,
            activeLinks: 4,
            expiredLinks: 1,
            totalViews: 100,
          };

          mockPublicLinksService.getUserLinkStats.mockResolvedValue(stats);

          const result = await controller.getSharingStats(mockUser);

          expect(mockPublicLinksService.getUserLinkStats).toHaveBeenCalledWith(
            mockUser.id,
          );
          expect(result.totalLinks).toBe(5);
          expect(result.activeLinks).toBe(4);
          expect(result.expiredLinks).toBe(1);
          expect(result.totalViews).toBe(100);
        });
      });
    });
  });
});
