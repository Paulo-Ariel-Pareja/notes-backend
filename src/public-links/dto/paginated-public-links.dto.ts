import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PublicLinkResponseDto } from './public-link-response.dto';

export class PaginatedPublicLinksDto {
  @ApiProperty({
    description: 'Array of public links',
    type: [PublicLinkResponseDto],
  })
  @Expose()
  @Type(() => PublicLinkResponseDto)
  links: PublicLinkResponseDto[];

  @ApiProperty({
    description: 'Total number of public links',
    example: 15,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
  })
  @Expose()
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  @Expose()
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  @Expose()
  hasPreviousPage: boolean;

  constructor(partial: Partial<PaginatedPublicLinksDto>) {
    Object.assign(this, partial);
    this.hasNextPage = this.page < this.totalPages;
    this.hasPreviousPage = this.page > 1;
  }
}