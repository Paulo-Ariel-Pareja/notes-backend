import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note } from './entities/note.entity';
import { PublicLinksModule } from '../public-links/public-links.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), PublicLinksModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
