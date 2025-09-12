import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicLinksModule } from '../public-links/public-links.module';

@Module({
  imports: [PublicLinksModule],
  controllers: [PublicController],
})
export class PublicModule {}
