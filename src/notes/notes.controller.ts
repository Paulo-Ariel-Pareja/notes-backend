import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { PublicLinksService } from '../public-links/public-links.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteResponseDto,
  NoteSearchDto,
  NoteStatsDto,
  PaginatedNotesDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AbacGuard } from '../abac/guards/abac.guard';
import {
  RequireNoteCreate,
  RequireNoteRead,
  RequireNoteUpdate,
  RequireNoteDelete,
  RequireNoteShare,
  RequirePublicLinkCreate,
  RequirePublicLinkDelete,
  RequirePublicLinkList,
} from '../abac/decorators/abac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

import {
  CreatePublicLinkDto,
  UpdatePublicLinkDto,
  PublicLinkResponseDto,
  PaginatedPublicLinksDto,
  PublicLinkStatsDto,
} from '../public-links/dto';

@ApiTags('Notes')
@ApiBearerAuth('JWT-auth')
@Controller('notes')
@UseGuards(JwtAuthGuard, AbacGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly publicLinksService: PublicLinksService,
  ) {}

  @Post()
  @RequireNoteCreate()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser() currentUser: User,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.create(
      createNoteDto.title,
      createNoteDto.description,
      currentUser.id,
    );

    return plainToInstance(NoteResponseDto, note);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() searchDto: NoteSearchDto,
  ): Promise<PaginatedNotesDto> {
    const result = await this.notesService.search(
      currentUser.id,
      searchDto.page,
      searchDto.limit,
      searchDto?.status,
      searchDto?.search,
    );

    return new PaginatedNotesDto({
      notes: result.notes.map((note) => plainToInstance(NoteResponseDto, note)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  }

  @Get('stats')
  async getStats(@CurrentUser() currentUser: User): Promise<NoteStatsDto> {
    const stats = await this.notesService.getUserNoteStats(currentUser.id);
    return new NoteStatsDto(stats);
  }

  @Get('recent')
  async getRecent(
    @CurrentUser() currentUser: User,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<NoteResponseDto[]> {
    const notes = await this.notesService.getRecentNotes(currentUser.id, limit);
    return notes.map((note) => plainToInstance(NoteResponseDto, note));
  }

  @Get('shared')
  @RequirePublicLinkList()
  async getSharedNotes(
    @CurrentUser() currentUser: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPublicLinksDto> {
    const result = await this.publicLinksService.findAllByUser(
      currentUser.id,
      page,
      limit,
    );

    return new PaginatedPublicLinksDto({
      links: result.links.map((link) =>
        plainToInstance(PublicLinkResponseDto, link),
      ),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  }

  @Get(':id')
  @RequireNoteRead('id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.findByIdAndOwner(id, currentUser.id);
    if (!note) {
      throw new Error('Note not found');
    }

    return plainToInstance(NoteResponseDto, note);
  }

  @Patch(':id')
  @RequireNoteUpdate('id')
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser() currentUser: User,
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.update(
      id,
      updateNoteDto,
      currentUser.id,
    );
    return plainToInstance(NoteResponseDto, note);
  }

  @Delete(':id')
  @RequireNoteDelete('id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.notesService.delete(id, currentUser.id);

    return { message: 'Note deleted successfully' };
  }

  @Post(':id/share')
  @RequireNoteShare('id')
  @RequirePublicLinkCreate()
  @HttpCode(HttpStatus.CREATED)
  async shareNote(
    @Param('id') id: string,
    @Body() createPublicLinkDto: CreatePublicLinkDto,
    @CurrentUser() currentUser: User,
  ): Promise<PublicLinkResponseDto> {
    const expiresAt = createPublicLinkDto.expiresAt
      ? new Date(createPublicLinkDto.expiresAt)
      : undefined;

    const publicLink = await this.publicLinksService.createPublicLink(
      id,
      currentUser.id,
      createPublicLinkDto.description,
      expiresAt,
    );

    return plainToInstance(PublicLinkResponseDto, publicLink);
  }

  @Patch('shared/:publicId')
  @RequirePublicLinkDelete()
  async updateSharedNote(
    @Param('publicId') publicId: string,
    @Body() updatePublicLinkDto: UpdatePublicLinkDto,
    @CurrentUser() currentUser: User,
  ): Promise<PublicLinkResponseDto> {
    const publicLink = await this.publicLinksService.getByPublicId(publicId);
    if (!publicLink || publicLink.createdById !== currentUser.id) {
      throw new Error(
        'Public link not found or you do not have permission to update it',
      );
    }

    const updates: any = {};
    if (updatePublicLinkDto.description)
      updates.description = updatePublicLinkDto.description;
    if (updatePublicLinkDto.expiresAt)
      updates.expiresAt = new Date(updatePublicLinkDto.expiresAt);

    const updatedLink = await this.publicLinksService.updatePublicLink(
      publicLink.id,
      currentUser.id,
      updates,
    );

    return plainToInstance(PublicLinkResponseDto, updatedLink);
  }

  @Delete('shared/:publicId')
  @RequirePublicLinkDelete()
  @HttpCode(HttpStatus.OK)
  async removeSharedNote(
    @Param('publicId') publicId: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.publicLinksService.deleteByPublicId(publicId, currentUser.id);

    return { message: 'Public link deleted successfully' };
  }

  @Get('shared/stats')
  @RequirePublicLinkList()
  async getSharingStats(
    @CurrentUser() currentUser: User,
  ): Promise<PublicLinkStatsDto> {
    const stats = await this.publicLinksService.getUserLinkStats(
      currentUser.id,
    );
    return new PublicLinkStatsDto(stats);
  }
}
