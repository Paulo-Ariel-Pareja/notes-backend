import { Expose } from 'class-transformer';

export class PublicLinkStatsDto {
  @Expose()
  totalLinks: number;

  @Expose()
  activeLinks: number;

  @Expose()
  expiredLinks: number;

  @Expose()
  totalViews: number;

  constructor(partial: Partial<PublicLinkStatsDto>) {
    Object.assign(this, partial);
  }
}