import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PublicLinksService } from '../public-links/public-links.service';
import { NoteResponseDto } from '../notes/dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicLinksService: PublicLinksService) {}

  /**
   * Get public note by public ID (no authentication required)
   * @param publicId - Public ID of the shared note
   * @returns Note data if accessible
   */
  @ApiOperation({
    summary: 'Get public note',
    description:
      'Access a publicly shared note using its public ID (no authentication required)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the shared note',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Note retrieved successfully',
    type: NoteResponseDto,
    example: {
      id: 'uuid-string',
      title: 'My Public Note',
      description: 'This is a publicly shared note',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      owner: {
        id: 'owner-uuid',
        email: 'owner@example.com',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid public ID format',
    example: {
      statusCode: 400,
      message: 'Invalid public ID',
      error: 'Bad Request',
    },
  })
  @ApiNotFoundResponse({
    description: 'Note not found or no longer available',
    example: {
      statusCode: 404,
      message: 'Note not found or no longer available',
      error: 'Not Found',
    },
  })
  @Get('notes/:publicId')
  async getPublicNote(
    @Param('publicId') publicId: string,
  ): Promise<NoteResponseDto> {
    const note = await this.publicLinksService.accessPublicNote(
      publicId.trim(),
    );

    if (!note)
      throw new NotFoundException('Note not found or no longer available');

    return plainToInstance(NoteResponseDto, note);
  }

  /**
   * Health check endpoint for public access
   * @returns Health status
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'notes-backend-public',
    };
  }
}
