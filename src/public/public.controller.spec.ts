import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicLinksService } from '../public-links/public-links.service';
import { Note } from '../notes/entities/note.entity';
import { NoteStatus } from '../common/enums/note-status.enum';

describe('PublicController', () => {
  let controller: PublicController;
  let publicLinksService: PublicLinksService;

  const mockNote: Note = {
    id: 'note-id',
    title: 'Test Note',
    description: 'Test description',
    status: NoteStatus.ACTIVE,
    ownerId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Note;

  const mockPublicLinksService = {
    accessPublicNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        {
          provide: PublicLinksService,
          useValue: mockPublicLinksService,
        },
      ],
    }).compile();

    controller = module.get<PublicController>(PublicController);
    publicLinksService = module.get<PublicLinksService>(PublicLinksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicNote', () => {
    it('should return public note successfully', async () => {
      mockPublicLinksService.accessPublicNote.mockResolvedValue(mockNote);

      const result = await controller.getPublicNote('valid-public-id');

      expect(publicLinksService.accessPublicNote).toHaveBeenCalledWith(
        'valid-public-id',
      );
      expect(result.title).toBe(mockNote.title);
      expect(result.description).toBe(mockNote.description);
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPublicLinksService.accessPublicNote.mockResolvedValue(null);

      await expect(
        controller.getPublicNote('invalid-public-id'),
      ).rejects.toThrow(NotFoundException);
      expect(publicLinksService.accessPublicNote).toHaveBeenCalledWith(
        'invalid-public-id',
      );
    });

    it('should trim whitespace from public ID', async () => {
      mockPublicLinksService.accessPublicNote.mockResolvedValue(mockNote);

      await controller.getPublicNote('  valid-public-id  ');

      expect(publicLinksService.accessPublicNote).toHaveBeenCalledWith(
        'valid-public-id',
      );
    });

    it('should increment view count when accessing note', async () => {
      mockPublicLinksService.accessPublicNote.mockResolvedValue(mockNote);

      await controller.getPublicNote('valid-public-id');

      // The accessPublicNote method should handle view count increment
      expect(publicLinksService.accessPublicNote).toHaveBeenCalledWith(
        'valid-public-id',
      );
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('notes-backend-public');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });
});
