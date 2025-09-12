import { Expose, Type } from 'class-transformer';
import { PublicLinkResponseDto } from './public-link-response.dto';

export class PaginatedPublicLinksDto {
  @Expose()
  @Type(() => PublicLinkResponseDto)
  links: PublicLinkResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;

  constructor(partial: Partial<PaginatedPublicLinksDto>) {
    Object.assign(this, partial);
    this.hasNextPage = this.page < this.totalPages;
    this.hasPreviousPage = this.page > 1;
  }
}