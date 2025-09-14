import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicLinksService } from './public-links.service';
import { PublicLink } from './entities/public-link.entity';
import { Note } from '../notes/entities/note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PublicLink, Note])],
  providers: [PublicLinksService],
  exports: [TypeOrmModule, PublicLinksService],
})
export class PublicLinksModule {}
