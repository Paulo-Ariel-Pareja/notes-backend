import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PublicLinkStatsDto {
  @ApiProperty({
    description: 'Total number of public links',
    example: 15,
  })
  @Expose()
  totalLinks: number;

  @ApiProperty({
    description: 'Number of active (non-expired) public links',
    example: 12,
  })
  @Expose()
  activeLinks: number;

  @ApiProperty({
    description: 'Number of expired public links',
    example: 3,
  })
  @Expose()
  expiredLinks: number;

  @ApiProperty({
    description: 'Total views across all public links',
    example: 250,
  })
  @Expose()
  totalViews: number;

  constructor(partial: Partial<PublicLinkStatsDto>) {
    Object.assign(this, partial);
  }
}